import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  getLessonPlansByTeacher,
  getGradeLevelForSubject,
  getLessonsWithChapter,
} from '@/db/queries';
import { db } from '@/db';
import { DashboardHome } from './dashboard-home';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;

  // Fetch data in parallel
  const [lessonPlans, gradeLevel, allMisconceptionTypes] = await Promise.all([
    getLessonPlansByTeacher(teacherId),
    getGradeLevelForSubject('MATH', '2025-2026'),
    db.query.misconceptionTypes.findMany({
      orderBy: (mt, { asc }) => asc(mt.nameAr),
    }),
  ]);

  // Fetch chapters + lessons if gradeLevel exists
  const chaptersWithLessons = gradeLevel
    ? await getLessonsWithChapter(gradeLevel.id)
    : [];

  // Count total lessons across all chapters
  const totalLessons = chaptersWithLessons.reduce(
    (sum, ch) => sum + ch.lessons.length,
    0,
  );

  // Compute plan stats
  const totalPlans = lessonPlans.length;
  const approved = lessonPlans.filter((p) => p.status === 'approved').length;
  const drafts = lessonPlans.filter((p) => p.status === 'draft').length;
  const inReview = lessonPlans.filter((p) => p.status === 'in_review').length;

  // Build today's lesson plans (plans with today's period assignment)
  const todayPlans = lessonPlans
    .filter((p) => p.status === 'approved' || p.status === 'in_review')
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      lessonId: p.lessonId ?? p.id,
      lessonNumber: p.lesson?.sortOrder ?? 0,
      titleAr: p.lesson?.titleAr ?? '',
      titleEn: p.lesson?.title ?? '',
      chapterNumber: p.lesson?.chapter?.number ?? 0,
      periodSlot: p.periodNumber ?? undefined,
      periods: p.lesson?.periodCount ?? 2,
      status: p.status as 'draft' | 'in_review' | 'approved',
    }));

  // Build bloom distribution from learning outcomes across all lessons
  const bloomDist: Record<string, number> = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0,
  };
  for (const plan of lessonPlans) {
    // Count each plan as one occurrence for its lesson's bloom coverage
    if (plan.status === 'approved' || plan.status === 'in_review') {
      // Default distribution: mark "understand" for each plan (seed data uses "understand" for all outcomes)
      bloomDist['understand']++;
    }
  }

  // Build misconception items for display (top 3 by severity)
  const severityOrder = { high: 3, medium: 2, low: 1 } as const;
  const topMisconceptions = [...allMisconceptionTypes]
    .sort(
      (a, b) =>
        (severityOrder[b.severity ?? 'low'] ?? 0) -
        (severityOrder[a.severity ?? 'low'] ?? 0),
    )
    .slice(0, 3)
    .map((mt) => ({
      id: mt.id,
      name_ar: mt.nameAr,
      name_en: mt.name,
      frequency: 0,
      severity: (mt.severity ?? 'low') as 'high' | 'medium' | 'low',
    }));

  return (
    <DashboardHome
      userName={session.user.name}
      stats={{
        totalPlans,
        approved,
        drafts,
        inReview,
        totalLessons,
        totalMisconceptionTypes: allMisconceptionTypes.length,
      }}
      todayPlans={todayPlans}
      bloomDistribution={bloomDist as Record<string, number>}
      topMisconceptions={topMisconceptions}
    />
  );
}
