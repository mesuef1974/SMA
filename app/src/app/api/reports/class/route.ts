import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { getClassPerformance, getClassroomById } from '@/db/queries';
import { db } from '@/db';
import {
  assessmentQuestions,
  classroomStudents,
  studentResponses,
} from '@/db/schema';
import { count, eq } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// GET /api/reports/class
// Returns comprehensive performance report for a classroom.
// Auth required: teacher only.
// Query params:
//   - classroomId (required) — the classroom to report on
//   - lessonId (optional) — filter data to a specific lesson
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { error: 'غير مصرح — يرجى تسجيل الدخول' },
      { status: 401 },
    );
  }

  if (session.user.role !== 'teacher' && session.user.role !== 'admin') {
    return Response.json(
      { error: 'غير مصرح — هذا التقرير متاح للمعلمين فقط' },
      { status: 403 },
    );
  }

  const classroomId = req.nextUrl.searchParams.get('classroomId');
  if (!classroomId) {
    return Response.json(
      { error: 'الحقل "classroomId" مطلوب' },
      { status: 400 },
    );
  }

  try {
    // Fetch classroom details
    const classroom = await getClassroomById(classroomId);
    if (!classroom) {
      return Response.json(
        { error: 'الصف غير موجود' },
        { status: 404 },
      );
    }

    // Verify the teacher owns this classroom
    if (classroom.teacherId !== session.user.id && session.user.role !== 'admin') {
      return Response.json(
        { error: 'غير مصرح — هذا الصف ليس ملكك' },
        { status: 403 },
      );
    }

    // Fetch class performance data
    const performance = await getClassPerformance(classroomId);

    // Compute Bloom distribution across all student responses in this classroom
    const bloomDistribution = await db
      .select({
        bloomLevel: assessmentQuestions.bloomLevel,
        count: count(studentResponses.id),
      })
      .from(studentResponses)
      .innerJoin(
        assessmentQuestions,
        eq(studentResponses.assessmentQuestionId, assessmentQuestions.id),
      )
      .innerJoin(
        classroomStudents,
        eq(studentResponses.studentId, classroomStudents.id),
      )
      .where(eq(classroomStudents.classroomId, classroomId))
      .groupBy(assessmentQuestions.bloomLevel);

    // Normalize Bloom distribution
    const bloomDist: Record<string, number> = {
      remember: 0,
      understand: 0,
      apply: 0,
      analyze: 0,
      evaluate: 0,
      create: 0,
    };
    for (const row of bloomDistribution) {
      if (row.bloomLevel && row.bloomLevel in bloomDist) {
        bloomDist[row.bloomLevel] = row.count;
      }
    }

    // Compute total exercises and completion rate
    const totalExercises = performance.students.reduce(
      (sum, s) => sum + s.totalExercises,
      0,
    );
    const completedStudents = performance.students.filter(
      (s) => s.totalExercises > 0,
    ).length;
    const completionRate =
      performance.students.length > 0
        ? Math.round((completedStudents / performance.students.length) * 100)
        : 0;

    // Build response
    const report = {
      classroom: {
        name: classroom.name,
        nameAr: classroom.nameAr,
        studentCount: classroom.students?.length ?? 0,
      },
      summary: {
        averageAccuracy: performance.classStats.averageAccuracy,
        totalExercises,
        completionRate,
      },
      bloomDistribution: bloomDist,
      topMisconceptions: performance.commonMisconceptions.map((m) => ({
        name_ar: m.nameAr,
        name: m.name,
        count: m.occurrences,
        severity: m.severity,
      })),
      students: performance.students.map((s) => ({
        id: s.id,
        name: s.displayName,
        nameAr: s.displayNameAr,
        accuracy: s.accuracyRate,
        exercisesCompleted: s.totalExercises,
        correctExercises: s.correctExercises,
        misconceptionCount: s.totalMisconceptions,
        unresolvedMisconceptions: s.unresolvedMisconceptions,
      })),
    };

    return Response.json(report, { status: 200 });
  } catch (error) {
    console.error('[/api/reports/class] Error:', error);
    return Response.json(
      { error: 'حدث خطأ أثناء جلب تقرير الصف' },
      { status: 500 },
    );
  }
}
