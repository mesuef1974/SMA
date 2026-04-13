/**
 * Presentation Page — server component.
 *
 * Fetches lesson data and the teacher's lesson plan for a specific lesson,
 * then delegates rendering to the PresentationView client component which
 * provides a full-screen, projector-friendly slide show.
 */

import { setRequestLocale } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getLessonById, getLessonPlansByTeacher } from '@/db/queries';
import { PresentationView } from './presentation-view';

type Props = {
  params: Promise<{ locale: string; lessonId: string }>;
  searchParams: Promise<{ period?: string }>;
};

export default async function PresentPage({ params, searchParams }: Props) {
  const { locale, lessonId } = await params;
  const { period } = await searchParams;
  setRequestLocale(locale);

  // Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;

  // Fetch lesson and teacher's plans in parallel
  const [lesson, allPlans] = await Promise.all([
    getLessonById(lessonId),
    getLessonPlansByTeacher(teacherId),
  ]);

  if (!lesson) {
    notFound();
  }

  // Determine which period to show (default: first available plan, else 1)
  const requestedPeriod = period ? parseInt(period, 10) : null;
  const lessonPlans = allPlans.filter((p) => p.lessonId === lessonId);
  const targetPlan = requestedPeriod
    ? lessonPlans.find((p) => p.periodNumber === requestedPeriod)
    : lessonPlans[0];

  if (!targetPlan?.sectionData) {
    // No plan found — redirect back to prepare page
    redirect(`/${locale}/dashboard/lessons/${lessonId}/prepare`);
  }

  // Serialize data for the client component
  const serializedLesson = {
    id: lesson.id,
    titleAr: lesson.titleAr,
    title: lesson.title,
    number: lesson.number,
    chapter: lesson.chapter
      ? {
          number: lesson.chapter.number,
          titleAr: lesson.chapter.titleAr,
        }
      : null,
  };

  return (
    <PresentationView
      lesson={serializedLesson}
      plan={targetPlan.sectionData as Record<string, unknown>}
      periodNumber={targetPlan.periodNumber ?? 1}
      locale={locale}
      lessonId={lessonId}
    />
  );
}
