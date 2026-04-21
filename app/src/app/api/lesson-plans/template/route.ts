/**
 * POST /api/lesson-plans/template
 *
 * Creates a lesson plan from a pre-built template (no AI call needed).
 * Returns the created lesson plan record immediately.
 *
 * Input:  { lessonId: string, periodNumber: 1 | 2 | 3 | 4 }
 * Output: The created lesson plan record (201) or error
 *
 * Requires authentication (enforced by proxy.ts middleware).
 * Rate limited via the shared rate-limit utility.
 */

import { z } from 'zod';

import { auth } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateOrigin, csrfForbiddenResponse } from '@/lib/security/csrf';
import { createLessonPlan } from '@/db/queries';
import type { LessonPlanData } from '@/lib/lesson-plans/schema';
import { lesson51Period1, lesson51Period2 } from '@/lib/lesson-plans/templates/lesson-5-1';

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------

const TEMPLATES: Record<string, Partial<Record<1 | 2 | 3 | 4, LessonPlanData>>> = {
  '0f3d5c6d-f8e7-4b24-b1e7-528653eafc36': {
    1: lesson51Period1,
    2: lesson51Period2,
  },
};

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

const requestSchema = z.object({
  lessonId: z.string().uuid('lessonId يجب أن يكون UUID صالح'),
  periodNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)], {
    message: 'periodNumber يجب أن يكون 1 أو 2 أو 3 أو 4',
  }),
});

// ---------------------------------------------------------------------------
// Error response helper
// ---------------------------------------------------------------------------

interface ErrorResponse {
  error: string;
}

function errorJson(message: string, status: number): Response {
  return Response.json({ error: message } satisfies ErrorResponse, { status });
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  // --- CSRF Protection ---
  if (!validateOrigin(req)) return csrfForbiddenResponse();

  // --- Rate Limiting ---
  const rl = await rateLimit(req);
  if (!rl.success) return rateLimitResponse(rl);

  // --- Authentication ---
  const session = await auth();
  if (!session?.user?.id) {
    return errorJson('غير مصرّح — يرجى تسجيل الدخول', 401);
  }

  try {
    // --- Parse & validate request body ---
    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return errorJson(firstError?.message ?? 'الطلب غير صالح', 400);
    }

    const { lessonId, periodNumber } = parsed.data;

    // --- Look up template ---
    const lessonTemplates = TEMPLATES[lessonId];
    if (!lessonTemplates) {
      return errorJson('لا يوجد قالب لهذا الدرس', 404);
    }

    const sectionData = lessonTemplates[periodNumber as 1 | 2 | 3 | 4];
    if (!sectionData) {
      return errorJson('لا يوجد قالب لهذه الحصة', 404);
    }

    // --- Persist to DB ---
    const plan = await createLessonPlan({
      lessonId,
      teacherId: session.user.id,
      periodNumber,
      status: 'draft',
      sectionData,
      aiSuggestions: {
        model: 'template',
        generatedAt: new Date().toISOString(),
      },
    });

    return Response.json(plan, { status: 201 });
  } catch (error) {
    console.error('[/api/lesson-plans/template] Error:', error);

    if (error instanceof Error) {
      console.error('[lesson-plans/template]', error.message);
    }

    return errorJson('حدث خطأ غير متوقع أثناء إنشاء التحضير من القالب', 500);
  }
}
