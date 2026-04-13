'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  FileText,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { LessonCard } from '@/components/dashboard/lesson-card';
import { BloomChart } from '@/components/dashboard/bloom-chart';
import { MisconceptionAlert } from '@/components/dashboard/misconception-alert';
import { toArabicIndic } from '@/lib/numerals';
import type { BloomLevel } from '@/lib/bloom-keywords';

// ---------------------------------------------------------------------------
// Types — serializable data passed from the server component
// ---------------------------------------------------------------------------

interface DashboardStats {
  totalPlans: number;
  approved: number;
  drafts: number;
  inReview: number;
  totalLessons: number;
  totalMisconceptionTypes: number;
}

interface TodayPlan {
  id: string;
  lessonNumber: number;
  titleAr: string;
  titleEn: string;
  chapterNumber: number;
  periodSlot?: number;
  periods: number;
  status: 'draft' | 'in_review' | 'approved';
}

interface MisconceptionItem {
  id: string;
  name_ar: string;
  name_en: string;
  frequency: number;
  severity: 'high' | 'medium' | 'low';
}

interface DashboardHomeProps {
  userName?: string | null;
  stats: DashboardStats;
  todayPlans: TodayPlan[];
  bloomDistribution: Record<string, number>;
  topMisconceptions: MisconceptionItem[];
}

export function DashboardHome({
  userName,
  stats,
  todayPlans,
  bloomDistribution,
  topMisconceptions,
}: DashboardHomeProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const displayName = userName ?? '';

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));

  // Cast bloomDistribution to the expected Record<BloomLevel, number>
  const bloomDist = bloomDistribution as Record<BloomLevel, number>;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">
          {t('welcome', { name: displayName })}
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
          icon={BookOpen}
          label={t('totalLessons')}
          value={stats.totalLessons}
          iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <StatCard
          icon={AlertTriangle}
          label={t('misconceptions')}
          value={stats.totalMisconceptionTypes}
          detail={t('detectedThisWeek')}
          iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        />
        <StatCard
          icon={TrendingUp}
          label={t('completionRate')}
          value={stats.totalPlans > 0 ? Math.round((stats.approved / stats.totalPlans) * 100) : 0}
          detail={
            stats.totalPlans > 0
              ? (locale === 'ar'
                  ? `${toArabicIndic(Math.round((stats.approved / stats.totalPlans) * 100))}٪`
                  : `${Math.round((stats.approved / stats.totalPlans) * 100)}%`)
              : (locale === 'ar' ? '٠٪' : '0%')
          }
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
            {todayPlans.map((plan) => (
              <LessonCard
                key={plan.id}
                lessonNumber={plan.lessonNumber}
                titleAr={plan.titleAr}
                titleEn={plan.titleEn}
                chapterNumber={plan.chapterNumber}
                periodSlot={plan.periodSlot}
                periods={plan.periods}
                status={plan.status}
              />
            ))}
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
