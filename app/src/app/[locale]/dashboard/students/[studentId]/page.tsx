import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

import { auth } from '@/lib/auth';
import { getStudentById, getStudentPerformance } from '@/db/queries';
import { PerformanceView } from '@/app/[locale]/student/dashboard/performance/performance-view';

// ---------------------------------------------------------------------------
// Teacher: Individual Student Performance Detail
// /[locale]/dashboard/students/[studentId]
// Reuses the student PerformanceView component.
// ---------------------------------------------------------------------------

type Props = {
  params: Promise<{ locale: string; studentId: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'teacherStudents' });
  return { title: t('studentDetail') };
}

export default async function StudentDetailPage({ params }: Props) {
  const { locale, studentId } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const [student, performance] = await Promise.all([
    getStudentById(studentId),
    getStudentPerformance(studentId),
  ]);

  if (!student) {
    redirect(`/${locale}/dashboard/students`);
  }

  const studentName =
    locale === 'ar'
      ? student.displayNameAr
      : student.displayName;

  return (
    <PerformanceView
      studentName={studentName}
      performance={{
        totalExercises: performance.totalExercises,
        correctExercises: performance.correctExercises,
        accuracyRate: performance.accuracyRate,
        averageScore: performance.averageScore,
        misconceptions: performance.misconceptions.map((m) => ({
          id: m.id,
          code: m.code,
          nameAr: m.nameAr,
          name: m.name,
          severity: m.severity,
          confidence: m.confidence,
          resolved: m.resolved,
          remediationHintAr: m.remediationHintAr,
          remediationHint: m.remediationHint,
        })),
        lessonBreakdown: performance.lessonBreakdown.map((lb) => ({
          lessonId: lb.lessonId,
          lessonTitle: lb.lessonTitle,
          lessonTitleAr: lb.lessonTitleAr,
          totalResponses: lb.totalResponses,
          correctResponses: lb.correctResponses,
          accuracyRate: lb.accuracyRate,
        })),
      }}
    />
  );
}
