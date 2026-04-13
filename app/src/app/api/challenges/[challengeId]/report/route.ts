import { auth } from '@/lib/auth';
import { getChallengeReport } from '@/db/queries';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// GET /api/challenges/[challengeId]/report
// Returns full challenge report data for completed challenges.
// Auth required: teacher or admin.
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
    const report = await getChallengeReport(challengeId);

    if (!report) {
      return Response.json(
        { error: 'التحدي غير موجود' },
        { status: 404 },
      );
    }

    // Only allow reports for completed challenges
    if (!report.challenge.endedAt) {
      return Response.json(
        { error: 'التقرير متاح فقط للتحديات المكتملة' },
        { status: 400 },
      );
    }

    return Response.json(report);
  } catch (error) {
    console.error('[GET /api/challenges/:id/report] Error:', error);
    return Response.json(
      { error: 'حدث خطأ أثناء جلب تقرير التحدي' },
      { status: 500 },
    );
  }
}
