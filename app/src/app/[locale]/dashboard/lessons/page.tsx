import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  getGradeLevelForSubject,
  getLessonsWithChapter,
  getLessonPlansByTeacher,
} from '@/db/queries';
import { LessonsView } from './lessons-view';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LessonsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;

  // Fetch curriculum structure and teacher's plans in parallel
  const [gradeLevel, lessonPlans] = await Promise.all([
    getGradeLevelForSubject('MATH', '2025-2026'),
    getLessonPlansByTeacher(teacherId),
  ]);

  // Fetch chapters with lessons
  const chaptersWithLessons = gradeLevel
    ? await getLessonsWithChapter(gradeLevel.id)
    : [];

  // Build lesson plan status map: lessonId -> best status
  const lessonPlanStatusMap: Record<string, 'draft' | 'in_review' | 'approved'> = {};
  const statusPriority = { approved: 3, in_review: 2, draft: 1 } as const;
  for (const plan of lessonPlans) {
    if (plan.lessonId) {
      const current = lessonPlanStatusMap[plan.lessonId];
      const planStatus = plan.status as 'draft' | 'in_review' | 'approved';
      if (!current || (statusPriority[planStatus] ?? 0) > (statusPriority[current] ?? 0)) {
        lessonPlanStatusMap[plan.lessonId] = planStatus;
      }
    }
  }

  // Serialize chapter/lesson data for the client component
  const chapters = chaptersWithLessons.map((ch) => ({
    id: ch.id,
    number: ch.number,
    titleAr: ch.titleAr,
    titleEn: ch.title,
    lessons: ch.lessons.map((l) => ({
      id: l.id,
      chapterId: ch.id,
      number: l.sortOrder ?? 0,
      titleAr: l.titleAr,
      titleEn: l.title,
      periods: l.periodCount ?? 2,
      status: lessonPlanStatusMap[l.id] ?? null,
    })),
  }));

  return <LessonsView chapters={chapters} />;
}
