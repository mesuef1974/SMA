import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTeacherClassrooms } from '@/db/queries';
import { getClassPerformance } from '@/db/queries';
import { db } from '@/db';
import {
  assessmentQuestions,
  classroomStudents,
  studentResponses,
} from '@/db/schema';
import { count, eq } from 'drizzle-orm';
import { ReportsView } from './reports-view';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reports' });
  return { title: t('title') };
}

/**
 * Teacher reports page (server component).
 * Fetches all classrooms owned by the teacher with their performance data,
 * then passes serialized data to the client view.
 */
export default async function ReportsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;
  const classrooms = await getTeacherClassrooms(teacherId);

  // Fetch performance data for each classroom in parallel
  const classroomReports = await Promise.all(
    classrooms.map(async (classroom) => {
      const performance = await getClassPerformance(classroom.id);

      // Fetch Bloom distribution for this classroom
      const bloomRows = await db
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
        .where(eq(classroomStudents.classroomId, classroom.id))
        .groupBy(assessmentQuestions.bloomLevel);

      const bloomDistribution: Record<string, number> = {
        remember: 0,
        understand: 0,
        apply: 0,
        analyze: 0,
        evaluate: 0,
        create: 0,
      };
      for (const row of bloomRows) {
        if (row.bloomLevel && row.bloomLevel in bloomDistribution) {
          bloomDistribution[row.bloomLevel] = row.count;
        }
      }

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

      return {
        id: classroom.id,
        name: classroom.name,
        nameAr: classroom.nameAr,
        code: classroom.code,
        studentCount: classroom.students.length,
        summary: {
          averageAccuracy: performance.classStats.averageAccuracy,
          totalExercises,
          completionRate,
        },
        bloomDistribution,
        topMisconceptions: performance.commonMisconceptions.map((m) => ({
          nameAr: m.nameAr,
          name: m.name,
          count: m.occurrences,
          severity: (m.severity ?? 'low') as 'high' | 'medium' | 'low',
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
    }),
  );

  return <ReportsView classrooms={classroomReports} />;
}
