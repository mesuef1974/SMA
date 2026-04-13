import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

import { getStudentPerformance } from '@/db/queries';

// ---------------------------------------------------------------------------
// GET /api/student/performance
// Returns performance statistics for the authenticated student.
// Student identity comes from the httpOnly cookie set during join.
// Optional query param: lessonId — filter misconceptions by lesson.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const studentId = cookieStore.get('studentId')?.value;

  if (!studentId) {
    return Response.json(
      { error: 'غير مصرح — يرجى الانضمام إلى صف أولاً' },
      { status: 401 },
    );
  }

  try {
    const performance = await getStudentPerformance(studentId);

    // Optionally filter misconceptions by lesson
    const lessonId = req.nextUrl.searchParams.get('lessonId');
    if (lessonId) {
      performance.misconceptions = performance.misconceptions.filter(
        (m) => m.lessonId === lessonId,
      );
      performance.lessonBreakdown = performance.lessonBreakdown.filter(
        (lb) => lb.lessonId === lessonId,
      );
    }

    return Response.json(performance, { status: 200 });
  } catch (error) {
    console.error('[/api/student/performance] Error:', error);
    return Response.json(
      { error: 'حدث خطأ أثناء جلب بيانات الأداء' },
      { status: 500 },
    );
  }
}
