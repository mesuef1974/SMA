import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

import { getStudentPerformance, getStudentById } from '@/db/queries';
import { PerformanceView } from './performance-view';

// ---------------------------------------------------------------------------
// Student Performance Dashboard
// /[locale]/student/dashboard/performance
// No auth required — student identity from cookie
// ---------------------------------------------------------------------------

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'studentPerformance' });
  return { title: t('title') };
}

export default async function StudentPerformancePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const studentId = cookieStore.get('studentId')?.value;

  if (!studentId) {
    redirect(`/${locale}/student`);
  }

  // Fetch student info and performance in parallel
  const [student, performance] = await Promise.all([
    getStudentById(studentId),
    getStudentPerformance(studentId),
  ]);

  if (!student) {
    redirect(`/${locale}/student`);
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
