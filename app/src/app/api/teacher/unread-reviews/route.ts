/**
 * BL-026 — Teacher notification feed for advisor decisions.
 *
 *   GET  /api/teacher/unread-reviews
 *     List unread advisor reviews for every plan owned by the current
 *     teacher, newest first. Drives the bell-icon dropdown in the
 *     dashboard chrome.
 *
 *   POST /api/teacher/unread-reviews
 *     Mark unread reviews as read. Body:
 *       { planId?: string }    // omit to mark everything read
 *     Responds with the count of rows marked.
 */

import { auth } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import {
  getUnreadReviewsForTeacher,
  markReviewsReadForTeacher,
} from '@/db/queries';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorJson(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export async function GET(req: Request): Promise<Response> {
  const rl = await rateLimit(req);
  if (!rl.success) return rateLimitResponse(rl);

  const session = await auth();
  if (!session?.user?.id) {
    return errorJson('غير مصرّح — يرجى تسجيل الدخول', 401);
  }

  const reviews = await getUnreadReviewsForTeacher(session.user.id);
  return Response.json({ reviews }, { status: 200 });
}

export async function POST(req: Request): Promise<Response> {
  const rl = await rateLimit(req);
  if (!rl.success) return rateLimitResponse(rl);

  const session = await auth();
  if (!session?.user?.id) {
    return errorJson('غير مصرّح — يرجى تسجيل الدخول', 401);
  }

  let planId: string | undefined;
  try {
    // Body is optional — empty body means "mark all read".
    const text = await req.text();
    if (text.trim().length > 0) {
      const body = JSON.parse(text) as { planId?: unknown };
      if (body.planId !== undefined) {
        if (typeof body.planId !== 'string' || !UUID_RE.test(body.planId)) {
          return errorJson('معرّف الخطة غير صالح', 400);
        }
        planId = body.planId;
      }
    }
  } catch {
    return errorJson('صيغة الطلب غير صالحة', 400);
  }

  const marked = await markReviewsReadForTeacher(session.user.id, planId);
  return Response.json({ marked }, { status: 200 });
}
