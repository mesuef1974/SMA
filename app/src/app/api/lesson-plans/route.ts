/**
 * POST /api/lesson-plans
 *
 * Creates a lesson plan authored by the current teacher from the Composer UI
 * (P0.7). Unlike /generate, this endpoint does NOT run the AI pipeline — it
 * persists the teacher's own hand-authored sections verbatim.
 *
 * Input:  {
 *           lessonId: string (uuid),
 *           period: 1 | 2 | 3 | 4,
 *           title: string,
 *           sections: SectionData[],
 *           status?: 'draft' | 'published'
 *         }
 *
 * Output: { id: string, status: string } on 201
 *
 * Auth: requires a valid session. The plan is attributed to
 * `session.user.id`. No role gate — any authenticated teacher may create.
 */

import { z } from 'zod';

import { auth } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateOrigin, csrfForbiddenResponse } from '@/lib/security/csrf';
import { createLessonPlan } from '@/db/queries';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

// Composer section — flat, UI-oriented shape (distinct from the richer
// 8-section AI schema in lib/lesson-plans/schema.ts). We stay permissive
// on `body` to allow markdown/LaTeX/etc.
const sectionDataSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  minutes: z.number().min(0).max(180),
  body: z.string().max(20000).default(''),
  // Optional structured extras edited via ComposerField — kept permissive
  // so legacy payloads without them still pass validation.
  objectives: z.string().max(20000).optional(),
  materials: z.string().max(20000).optional(),
  assessment: z.string().max(20000).optional(),
  homework: z.string().max(20000).optional(),
});

export type SectionData = z.infer<typeof sectionDataSchema>;

const requestSchema = z.object({
  lessonId: z.string().uuid('lessonId يجب أن يكون UUID صالح'),
  period: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)], {
    message: 'period يجب أن يكون 1 أو 2 أو 3 أو 4',
  }),
  title: z.string().min(1, 'العنوان مطلوب').max(300),
  sections: z.array(sectionDataSchema).min(1, 'يجب أن يحتوي الدرس على قسم واحد على الأقل').max(30),
  // UI uses 'published'; we map it to the DB enum value 'approved' so the
  // existing advisor flow is not bypassed. Teachers can only save drafts
  // or mark a plan as ready-for-class ("published"); final status still
  // flows through the advisor workflow elsewhere.
  status: z.enum(['draft', 'published']).default('draft'),
});

function errorJson(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function mapStatus(s: 'draft' | 'published'): 'draft' | 'in_review' {
  // Publishing from the Composer puts the plan into the advisor queue.
  return s === 'published' ? 'in_review' : 'draft';
}

export async function POST(req: Request): Promise<Response> {
  // --- CSRF ---
  if (!validateOrigin(req)) return csrfForbiddenResponse();

  // --- Rate limit ---
  const rl = await rateLimit(req);
  if (!rl.success) return rateLimitResponse(rl);

  // --- Auth ---
  const session = await auth();
  if (!session?.user?.id) {
    return errorJson('غير مصرّح — يرجى تسجيل الدخول', 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson('نص الطلب غير صالح (JSON)', 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return errorJson(first?.message ?? 'الطلب غير صالح', 400);
  }

  const { lessonId, period, title, sections, status } = parsed.data;

  try {
    const inserted = await createLessonPlan({
      lessonId,
      teacherId: session.user.id,
      periodNumber: period,
      status: mapStatus(status),
      sectionData: { title, sections },
    });

    if (!inserted) {
      return errorJson('فشل إنشاء الخطة', 500);
    }

    return Response.json(
      { id: inserted.id, status: inserted.status ?? 'draft' },
      { status: 201 },
    );
  } catch (err) {
    console.error('[/api/lesson-plans POST] Error:', err);
    return errorJson('حدث خطأ أثناء حفظ الخطة', 500);
  }
}
