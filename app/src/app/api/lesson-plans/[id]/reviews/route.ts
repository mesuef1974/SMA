/**
 * GET /api/lesson-plans/[id]/reviews
 *
 * Returns the append-only history of advisor decisions on a lesson plan
 * (P1.3). Access is restricted to:
 *   - the plan's owning teacher
 *   - any advisor or admin
 */

import { auth } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import {
  getLessonPlanById,
  getLessonPlanReviewsByPlanId,
} from '@/db/queries';
import { isAdvisor } from '@/lib/advisor';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorJson(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
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

  const plan = await getLessonPlanById(id);
  if (!plan) {
    return errorJson('الخطة غير موجودة', 404);
  }

  const ownsPlan = plan.teacherId === session.user.id;
  const canView = ownsPlan || isAdvisor(session) || session.user.role === 'admin';
  if (!canView) {
    return errorJson('غير مصرّح بعرض سجل المراجعات لهذه الخطة', 403);
  }

  const reviews = await getLessonPlanReviewsByPlanId(id);
  return Response.json({ reviews }, { status: 200 });
}
