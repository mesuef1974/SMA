'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  FileText,
  Users,
  AlertTriangle,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { LessonCard } from '@/components/dashboard/lesson-card';
import { BloomChart } from '@/components/dashboard/bloom-chart';
import { MisconceptionAlert } from '@/components/dashboard/misconception-alert';
import {
  MOCK_TEACHERS,
  MOCK_MISCONCEPTIONS,
  getTodayLessonPlans,
  getBloomDistribution,
  getDashboardStats,
  getLessonForPlan,
  getChapterForLesson,
} from '@/lib/mock-data';
import { toArabicIndic } from '@/lib/numerals';

export function DashboardHome() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const teacher = MOCK_TEACHERS[0];
  const stats = getDashboardStats();
  const todayPlans = getTodayLessonPlans();
  const bloomDist = getBloomDistribution();
  const topMisconceptions = MOCK_MISCONCEPTIONS.slice(0, 3);

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));
  const pct = (n: number) => (locale === 'ar' ? `${toArabicIndic(n)}٪` : `${n}%`);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">
          {t('welcome', { name: teacher.name_ar })}
        </h2>
        <Button render={<Link href="/dashboard/lesson-plans" />} className="gap-1.5">
          <Plus className="size-4" aria-hidden="true" />
          {t('newLessonPlan')}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label={t('totalLessonPlans')}
          value={stats.totalPlans}
          detail={`${t('approved')}: ${num(stats.approved)} | ${t('draft')}: ${num(stats.drafts)}`}
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Users}
          label={t('totalStudents')}
          value={stats.totalStudents}
          iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <StatCard
          icon={AlertTriangle}
          label={t('misconceptions')}
          value={stats.weekMisconceptions}
          detail={t('detectedThisWeek')}
          iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        />
        <StatCard
          icon={TrendingUp}
          label={t('completionRate')}
          value={stats.avgCompletion}
          detail={pct(stats.avgCompletion)}
          iconClassName="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        />
      </div>

      {/* Today's Lessons */}
      <section aria-labelledby="today-lessons-heading">
        <div className="flex items-center justify-between mb-3">
          <h3 id="today-lessons-heading" className="text-lg font-semibold">
            {t('todayLessons')}
          </h3>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/lessons" />}>
            {t('viewAllLessons')}
          </Button>
        </div>

        {todayPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t('noLessonsToday')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {todayPlans.map((plan) => {
              const lesson = getLessonForPlan(plan);
              if (!lesson) return null;
              const chapter = getChapterForLesson(lesson);
              if (!chapter) return null;
              return (
                <LessonCard
                  key={plan.id}
                  lessonNumber={lesson.number}
                  titleAr={lesson.title_ar}
                  titleEn={lesson.title_en}
                  chapterNumber={chapter.number}
                  periodSlot={plan.periodSlot}
                  periods={lesson.periods}
                  status={plan.status}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom section: Bloom chart + Misconceptions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BloomChart distribution={bloomDist} />
        <MisconceptionAlert items={topMisconceptions} />
      </div>
    </div>
  );
}
