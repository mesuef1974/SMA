/**
 * Lesson Preparation Page — server component.
 *
 * Fetches lesson data, learning outcomes, and any existing lesson plans,
 * then delegates rendering to the PrepareView client component.
 */

import { setRequestLocale } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  getLessonById,
  getLessonPlansByTeacher,
  getLessonPlanReviewsByPlanId,
} from '@/db/queries';
import { PrepareView, type SerializedReview } from './prepare-view';

type Props = {
  params: Promise<{ locale: string; lessonId: string }>;
};

export default async function PreparePage({ params }: Props) {
  const { locale, lessonId } = await params;
  setRequestLocale(locale);

  // Authentication check
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;

  // Fetch lesson (with chapter + learning outcomes) and teacher's plans in parallel
  const [lesson, allPlans] = await Promise.all([
    getLessonById(lessonId),
    getLessonPlansByTeacher(teacherId),
  ]);

  if (!lesson) {
    notFound();
  }

  // Filter plans for this specific lesson
  const lessonPlans = allPlans.filter((p) => p.lessonId === lessonId);

  // Serialize data for the client component
  const serializedLesson = {
    id: lesson.id,
    titleAr: lesson.titleAr,
    title: lesson.title,
    number: lesson.number,
    periodCount: lesson.periodCount ?? 2,
    pageStartTe: lesson.pageStartTe,
    pageEndTe: lesson.pageEndTe,
    pageStartSe: lesson.pageStartSe,
    pageEndSe: lesson.pageEndSe,
    chapter: lesson.chapter
      ? {
          id: lesson.chapter.id,
          number: lesson.chapter.number,
          title: lesson.chapter.title,
          titleAr: lesson.chapter.titleAr,
        }
      : null,
    learningOutcomes: (lesson.learningOutcomes ?? []).map((lo) => ({
      id: lo.id,
      code: lo.code,
      descriptionAr: lo.descriptionAr,
      description: lo.description,
      bloomLevel: lo.bloomLevel,
      sortOrder: lo.sortOrder,
    })),
  };

  const serializedPlans = lessonPlans.map((p) => ({
    id: p.id,
    periodNumber: p.periodNumber,
    status: p.status,
    sectionData: p.sectionData,
    createdAt: p.createdAt?.toISOString() ?? null,
  }));

  // BL-027 — SSR the latest advisor review per plan so the feedback
  // panel hydrates with data and skips the client-side fetch flicker.
  // Only plans in a reviewed state (approved | changes_requested |
  // rejected) carry a review — other plans map to null.
  const reviewableStatuses = new Set([
    'approved',
    'changes_requested',
    'rejected',
  ]);
  const initialReviewsEntries = await Promise.all(
    lessonPlans
      .filter((p) => p.status && reviewableStatuses.has(p.status))
      .map(async (p): Promise<[string, SerializedReview | null]> => {
        const rows = await getLessonPlanReviewsByPlanId(p.id);
        const r = rows[0];
        if (!r) return [p.id, null];
        return [
          p.id,
          {
            id: r.id,
            decision: r.decision,
            comment: r.comment,
            rubricScores: (r.rubricScores ?? null) as SerializedReview['rubricScores'],
            createdAt: r.createdAt.toISOString(),
            reviewer: r.reviewer
              ? {
                  id: r.reviewer.id,
                  fullName: r.reviewer.fullName,
                  fullNameAr: r.reviewer.fullNameAr,
                  email: r.reviewer.email,
                  role: r.reviewer.role,
                }
              : null,
          },
        ];
      }),
  );
  const initialReviews = Object.fromEntries(initialReviewsEntries);

  return (
    <PrepareView
      lesson={serializedLesson}
      existingPlans={serializedPlans}
      initialReviews={initialReviews}
    />
  );
}
