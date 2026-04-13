import { auth } from '@/lib/auth';
import {
  getChallengeStatus,
  getChallengeLeaderboard,
  startChallenge,
  endChallenge,
} from '@/db/queries';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// GET /api/challenges/[challengeId]
// Returns challenge status, teams, and scores.
// Auth required: teacher.
// ---------------------------------------------------------------------------

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ challengeId: string }> },
) {
  const { challengeId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: 'غير مصرح — يرجى تسجيل الدخول' },
      { status: 401 },
    );
  }

  if (!UUID_RE.test(challengeId)) {
    return Response.json(
      { error: 'معرف التحدي غير صالح' },
      { status: 400 },
    );
  }

  try {
    const status = await getChallengeStatus(challengeId);
    if (!status) {
      return Response.json(
        { error: 'التحدي غير موجود' },
        { status: 404 },
      );
    }

    const leaderboard = await getChallengeLeaderboard(challengeId);

    return Response.json({
      ...status,
      leaderboard,
    });
  } catch (error) {
    console.error('[GET /api/challenges/:id] Error:', error);
    return Response.json(
      { error: 'حدث خطأ أثناء جلب بيانات التحدي' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/challenges/[challengeId]
// Start or end a challenge. Body: { action: 'start' | 'end' }
// Auth required: teacher.
// ---------------------------------------------------------------------------

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ challengeId: string }> },
) {
  const { challengeId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: 'غير مصرح — يرجى تسجيل الدخول' },
      { status: 401 },
    );
  }

  if (session.user.role !== 'teacher' && session.user.role !== 'admin') {
    return Response.json(
      { error: 'غير مصرح — هذا الإجراء متاح للمعلمين فقط' },
      { status: 403 },
    );
  }

  if (!UUID_RE.test(challengeId)) {
    return Response.json(
      { error: 'معرف التحدي غير صالح' },
      { status: 400 },
    );
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = body.action;

    if (action !== 'start' && action !== 'end') {
      return Response.json(
        { error: 'الإجراء يجب أن يكون "start" أو "end"' },
        { status: 400 },
      );
    }

    let updated;

    if (action === 'start') {
      updated = await startChallenge(challengeId);
    } else {
      updated = await endChallenge(challengeId);
    }

    if (!updated) {
      return Response.json(
        { error: 'التحدي غير موجود' },
        { status: 404 },
      );
    }

    return Response.json({
      id: updated.id,
      status: updated.status,
      startedAt: updated.startedAt?.toISOString() ?? null,
      endedAt: updated.endedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[PATCH /api/challenges/:id] Error:', error);
    return Response.json(
      { error: 'حدث خطأ أثناء تحديث حالة التحدي' },
      { status: 500 },
    );
  }
}
