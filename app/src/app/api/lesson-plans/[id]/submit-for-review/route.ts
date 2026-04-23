/**
 * POST /api/lesson-plans/[id]/submit-for-review
 *
 * Teacher hands off a draft plan to the advisor queue. Transitions the plan
 * from `draft` (or `changes_requested` for re-submission) to `in_review`.
 *
 * The state transition on `lesson_plans.status` is itself the audit trail for
 * the submit event; `lesson_plan_reviews` is reserved for advisor decisions
 * (approved / rejected / changes_requested) only.
 *
 * Input:  (no body required)
 * Output: { ok: true, status: 'in_review' } on success, or 4xx on invalid
 *         transition / auth.
 *
 * Authorization:
 *   - session.user.id === plan.teacherId (only the author can submit)
 *
 * Valid source states:
 *   - 'draft'             — first-time submission
 *   - 'changes_requested' — teacher re-submits after advisor requested edits
 *
 * Any other state is a no-op / conflict (409), including `in_review` itself.
 */

import { auth } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateOrigin, csrfForbiddenResponse } from '@/lib/security/csrf';
import { getLessonPlanById, updateLessonPlan } from '@/db/queries';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ErrorResponse {
  error: string;
}

function errorJson(message: string, status: number): Response {
  return Response.json({ error: message } satisfies ErrorResponse, { status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
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

  // --- Validate the id param ---
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return errorJson('معرّف الخطة غير صالح', 400);
  }

  try {
    const plan = await getLessonPlanById(id);
    if (!plan) {
      return errorJson('الخطة غير موجودة', 404);
    }

    // --- Ownership check: only the authoring teacher can submit ---
    if (plan.teacherId !== session.user.id) {
      return errorJson(
        'غير مصرّح — يمكن لمؤلّف الخطة فقط إرسالها للمراجعة',
        403,
      );
    }

    // --- Transition guard ---
    // Allow (re)submission only from 'draft' or 'changes_requested'. Any other
    // state (in_review, approved, archived, rejected_gate) is rejected so
    // the audit trail stays clean.
    const current = plan.status ?? 'draft';
    if (current !== 'draft' && current !== 'changes_requested') {
      return errorJson(
        `لا يمكن إرسال الخطة للمراجعة من الحالة الحالية (${current})`,
        409,
      );
    }

    await updateLessonPlan(id, { status: 'in_review' });

    return Response.json({ ok: true, status: 'in_review' as const }, { status: 200 });
  } catch (error) {
    console.error('[/api/lesson-plans/[id]/submit-for-review] Error:', error);
    return errorJson('حدث خطأ غير متوقع أثناء إرسال الخطة للمراجعة', 500);
  }
}
