/**
 * PATCH /api/lesson-plans/[id]
 *
 * Updates a teacher-authored lesson plan from the Composer UI (P0.7).
 * Ownership is strictly enforced: only the plan's creating teacher may
 * mutate it through this endpoint. Advisor workflow mutations live in
 * the sibling `/advisor-decision` route.
 *
 * Input:  { title?, sections?, status? }
 * Output: the updated lesson plan row (200)
 *
 * Auth: session required. Returns 403 if `plan.teacherId !== session.user.id`.
 */

import { z } from 'zod';

import { auth } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateOrigin, csrfForbiddenResponse } from '@/lib/security/csrf';
import { getLessonPlanById, updateLessonPlan } from '@/db/queries';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sectionDataSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  minutes: z.number().min(0).max(180),
  body: z.string().max(20000).default(''),
});

const requestSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    sections: z.array(sectionDataSchema).min(1).max(30).optional(),
    status: z.enum(['draft', 'published']).optional(),
  })
  .refine((v) => v.title !== undefined || v.sections !== undefined || v.status !== undefined, {
    message: 'يجب تحديد حقل واحد على الأقل للتحديث',
  });

function errorJson(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function mapStatus(s: 'draft' | 'published'): 'draft' | 'in_review' {
  return s === 'published' ? 'in_review' : 'draft';
}

type SectionDataObject = Record<string, unknown>;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!validateOrigin(req)) return csrfForbiddenResponse();

  const rl = await rateLimit(req);
  if (!rl.success) return rateLimitResponse(rl);

  const session = await auth();
  if (!session?.user?.id) {
    return errorJson('غير مصرّح — يرجى تسجيل الدخول', 401);
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return errorJson('معرّف الخطة غير صالح', 400);
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

  const plan = await getLessonPlanById(id);
  if (!plan) {
    return errorJson('الخطة غير موجودة', 404);
  }

  if (plan.teacherId !== session.user.id) {
    return errorJson('غير مصرّح بتعديل هذه الخطة', 403);
  }

  const { title, sections, status } = parsed.data;

  // Merge into the existing sectionData jsonb rather than overwriting, so
  // richer fields (gate_results, AI-generated sections) are not wiped out
  // when the teacher saves a partial Composer edit.
  const existing: SectionDataObject =
    plan.sectionData && typeof plan.sectionData === 'object' && !Array.isArray(plan.sectionData)
      ? { ...(plan.sectionData as SectionDataObject) }
      : {};

  if (title !== undefined) existing.title = title;
  if (sections !== undefined) existing.sections = sections;

  const patch: Parameters<typeof updateLessonPlan>[1] = {
    sectionData: existing,
  };
  if (status !== undefined) patch.status = mapStatus(status);

  try {
    const updated = await updateLessonPlan(id, patch);
    if (!updated) {
      return errorJson('فشل تحديث الخطة', 500);
    }
    return Response.json(updated, { status: 200 });
  } catch (err) {
    console.error('[/api/lesson-plans/[id] PATCH] Error:', err);
    return errorJson('حدث خطأ أثناء تحديث الخطة', 500);
  }
}
