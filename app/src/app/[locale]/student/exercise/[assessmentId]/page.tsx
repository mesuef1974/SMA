import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getAssessmentWithQuestions } from '@/db/queries';
import { ExerciseView } from './exercise-view';

type Props = {
  params: Promise<{ locale: string; assessmentId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'exercise' });
  return { title: t('title') };
}

/**
 * Exercise page — server component.
 * Fetches the assessment + questions via DAL, reads studentId from cookie,
 * and passes data to the ExerciseView client component.
 *
 * Public route — no NextAuth required (uses studentId cookie from S2-1 join).
 */
export default async function ExercisePage({ params }: Props) {
  const { locale, assessmentId } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'exercise' });

  // Read studentId from cookie (set during S2-1 join flow)
  const cookieStore = await cookies();
  const studentId = cookieStore.get('studentId')?.value;

  if (!studentId) {
    redirect(`/${locale === 'ar' ? '' : locale + '/'}student`);
  }

  // Fetch assessment with questions via DAL
  const assessment = await getAssessmentWithQuestions(assessmentId);

  if (!assessment) {
    notFound();
  }

  // Serialize questions for the client component
  const questions = assessment.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    questionTextAr: q.questionTextAr,
    questionType: q.questionType,
    bloomLevel: q.bloomLevel,
    points: q.points,
    sortOrder: q.sortOrder,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <ExerciseView
        assessmentId={assessment.id}
        title={locale === 'ar' ? assessment.titleAr : assessment.title}
        questions={questions}
        studentId={studentId}
        locale={locale}
        noQuestionsText={t('noQuestions')}
      />
    </div>
  );
}
