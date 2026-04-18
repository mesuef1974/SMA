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
  lessonId: string;
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
  const bloomDist = bloomDistribution as Record<BloomLevel, number>;

  // Current time greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

  return (
    <div className="space-y-6 p-6">

      {/* ── Hero: Greeting + Quick Action ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-0.5">{greeting} ،</p>
          <h2 className="text-2xl font-bold tracking-tight">{displayName || 'المعلم'}</h2>
        </div>
        <Button
          render={<Link href="/dashboard/lesson-plans" />}
          className="gap-2 shadow-sm"
          style={{ background: 'var(--sma-najm-700)', color: 'white' }}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('newLessonPlan')}
        </Button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: FileText,
            label: t('totalLessonPlans'),
            value: stats.totalPlans,
            sub: `${num(stats.approved)} معتمد · ${num(stats.drafts)} مسودة`,
            accent: 'var(--sma-najm-700)',
          },
          {
            icon: BookOpen,
            label: 'الدروس',
            value: stats.totalLessons,
            sub: 'في المنهج',
            accent: 'var(--sma-sahla-500)',
          },
          {
            icon: AlertTriangle,
            label: 'المفاهيم الخاطئة',
            value: stats.totalMisconceptionTypes,
            sub: 'نوع مرصود',
            accent: 'var(--sma-qamar-500)',
          },
          {
            icon: TrendingUp,
            label: 'نسبة الإنجاز',
            value: stats.totalPlans > 0 ? `${Math.round((stats.approved / stats.totalPlans) * 100)}٪` : '٠٪',
            sub: 'تحضيرات معتمدة',
            accent: 'var(--sma-sahla-500)',
          },
        ].map(({ icon: Icon, label, value, sub, accent }) => (
          <div
            key={label}
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div
                className="size-8 rounded-lg flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
              >
                <Icon className="size-4" style={{ color: accent }} />
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {typeof value === 'number' ? num(value) : value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Today's Lessons + Misconceptions (2-col) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Lessons — takes 2/3 */}
        <section className="lg:col-span-2" aria-labelledby="today-lessons-heading">
          <div className="flex items-center justify-between mb-3">
            <h3 id="today-lessons-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('todayLessons')}
            </h3>
            <Button variant="ghost" size="sm" render={<Link href="/dashboard/lessons" />} className="text-xs h-7">
              {t('viewAllLessons')} ←
            </Button>
          </div>
          {todayPlans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
              <BookOpen className="mx-auto size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">{t('noLessonsToday')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayPlans.map((plan) => (
                <LessonCard
                  key={plan.id}
                  lessonId={plan.lessonId}
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

        {/* Misconceptions — takes 1/3 */}
        <section aria-labelledby="misconceptions-heading">
          <h3 id="misconceptions-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            أبرز المفاهيم الخاطئة
          </h3>
          <MisconceptionAlert items={topMisconceptions} />
        </section>
      </div>

      {/* ── Bloom Chart ── */}
      <section aria-labelledby="bloom-heading">
        <h3 id="bloom-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          توزيع مستويات بلوم
        </h3>
        <BloomChart distribution={bloomDist} />
      </section>

    </div>
  );
}
