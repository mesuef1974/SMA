'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Target,
  BookOpen,
  AlertTriangle,
  Trophy,
  GraduationCap,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { toArabicIndic } from '@/lib/numerals';
import { cn } from '@/lib/utils';
import { BLOOM_KEYWORDS, BLOOM_LEVELS_ORDERED, type BloomLevel } from '@/lib/bloom-keywords';

// ---------------------------------------------------------------------------
// Types -- serializable data passed from the server component
// ---------------------------------------------------------------------------

interface StudentReport {
  id: string;
  name: string;
  nameAr: string;
  accuracy: number;
  exercisesCompleted: number;
  correctExercises: number;
  misconceptionCount: number;
  unresolvedMisconceptions: number;
}

interface MisconceptionReport {
  nameAr: string;
  name: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
}

interface ClassroomReport {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  studentCount: number;
  summary: {
    averageAccuracy: number;
    totalExercises: number;
    completionRate: number;
  };
  bloomDistribution: Record<string, number>;
  topMisconceptions: MisconceptionReport[];
  students: StudentReport[];
}

interface ReportsViewProps {
  classrooms: ClassroomReport[];
}

// ---------------------------------------------------------------------------
// Severity styles (shared)
// ---------------------------------------------------------------------------

const severityStyles: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

/** Tailwind bar colour per Bloom level */
const BLOOM_COLORS: Record<BloomLevel, string> = {
  remember: 'bg-sky-500',
  understand: 'bg-teal-500',
  apply: 'bg-emerald-500',
  analyze: 'bg-amber-500',
  evaluate: 'bg-orange-500',
  create: 'bg-rose-500',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Client view for teacher class reports.
 * Displays summary cards, Bloom distribution chart, misconception table,
 * and student leaderboard for the selected classroom.
 */
export function ReportsView({ classrooms }: ReportsViewProps) {
  const t = useTranslations('reports');
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState<string>(
    classrooms[0]?.id ?? '',
  );

  const selected = classrooms.find((c) => c.id === selectedId);

  /** Format number according to locale. */
  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));

  /**
   * Percentage display.
   * Founder requirement 2026-04-14: Latin digits + Latin '%' in both locales.
   */
  const pct = (n: number) => `${n}%`;

  if (classrooms.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <GraduationCap className="size-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t('noClassrooms')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sort students by accuracy descending for leaderboard
  const rankedStudents = selected
    ? [...selected.students].sort((a, b) => b.accuracy - a.accuracy)
    : [];

  const bloomDist = (selected?.bloomDistribution ?? {}) as Record<
    BloomLevel,
    number
  >;
  const maxBloom = Math.max(
    ...BLOOM_LEVELS_ORDERED.map((l) => bloomDist[l] ?? 0),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Page header + classroom selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{t('title')}</h2>

        {classrooms.length > 1 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={t('selectClassroom')}
          >
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === 'ar' ? c.nameAr : c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selected && (
        <>
          {/* ---- Summary Cards ---- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label={t('totalStudents')}
              value={selected.studentCount}
              iconClassName="bg-primary/10 text-primary"
            />
            <StatCard
              icon={Target}
              label={t('averageAccuracy')}
              value={selected.summary.averageAccuracy}
              detail={pct(selected.summary.averageAccuracy)}
              iconClassName="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            />
            <StatCard
              icon={BookOpen}
              label={t('totalExercises')}
              value={selected.summary.totalExercises}
              detail={`${t('completionRate')}: ${pct(selected.summary.completionRate)}`}
              iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            />
            <StatCard
              icon={AlertTriangle}
              label={t('misconceptions')}
              value={selected.topMisconceptions.reduce(
                (sum, m) => sum + m.count,
                0,
              )}
              iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            />
          </div>

          {/* ---- Middle row: Bloom chart + Misconceptions table ---- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Bloom Distribution Chart (CSS bars) */}
            <Card>
              <CardHeader>
                <CardTitle>{t('bloomDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {BLOOM_LEVELS_ORDERED.map((level) => {
                    const info = BLOOM_KEYWORDS[level];
                    const c = bloomDist[level] ?? 0;
                    const widthPct = Math.round((c / maxBloom) * 100);
                    const label =
                      locale === 'ar' ? info.label_ar : info.label_en;

                    return (
                      <div key={level} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{label}</span>
                          <span className="font-medium tabular-nums">
                            {num(c)}
                          </span>
                        </div>
                        <div
                          className="h-2 w-full rounded-full bg-muted overflow-hidden"
                          role="progressbar"
                          aria-valuenow={c}
                          aria-valuemin={0}
                          aria-valuemax={maxBloom}
                          aria-label={label}
                        >
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              BLOOM_COLORS[level],
                            )}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Misconceptions Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="size-5 text-amber-500"
                    aria-hidden="true"
                  />
                  <CardTitle>{t('topMisconceptions')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {selected.topMisconceptions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t('noMisconceptions')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="pb-2 text-start font-medium">
                            {t('misconceptionName')}
                          </th>
                          <th className="pb-2 text-center font-medium">
                            {t('occurrences')}
                          </th>
                          <th className="pb-2 text-center font-medium">
                            {t('severity')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selected.topMisconceptions.map((m, idx) => {
                          const name =
                            locale === 'ar' ? m.nameAr : m.name;
                          const severityLabel =
                            m.severity === 'high'
                              ? t('high')
                              : m.severity === 'medium'
                                ? t('medium')
                                : t('low');

                          return (
                            <tr key={idx}>
                              <td className="py-2.5 font-medium">{name}</td>
                              <td className="py-2.5 text-center tabular-nums">
                                {num(m.count)}
                              </td>
                              <td className="py-2.5 text-center">
                                <Badge
                                  className={cn(
                                    'shrink-0',
                                    severityStyles[m.severity] ?? '',
                                  )}
                                >
                                  {severityLabel}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ---- Student Leaderboard ---- */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy
                  className="size-5 text-amber-500"
                  aria-hidden="true"
                />
                <CardTitle>{t('studentLeaderboard')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {rankedStudents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t('noStudents')}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2 text-start font-medium w-10">
                          #
                        </th>
                        <th className="pb-2 text-start font-medium">
                          {t('studentName')}
                        </th>
                        <th className="pb-2 text-center font-medium">
                          {t('accuracy')}
                        </th>
                        <th className="pb-2 text-center font-medium">
                          {t('exercises')}
                        </th>
                        <th className="pb-2 text-center font-medium">
                          {t('misconceptionsCol')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rankedStudents.map((student, idx) => {
                        const name =
                          locale === 'ar' ? student.nameAr : student.name;

                        return (
                          <tr key={student.id}>
                            <td className="py-2.5 tabular-nums text-muted-foreground">
                              {num(idx + 1)}
                            </td>
                            <td className="py-2.5 font-medium">{name}</td>
                            <td className="py-2.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all',
                                      student.accuracy >= 70
                                        ? 'bg-green-500'
                                        : student.accuracy >= 40
                                          ? 'bg-amber-500'
                                          : 'bg-red-500',
                                    )}
                                    style={{
                                      width: `${student.accuracy}%`,
                                    }}
                                  />
                                </div>
                                <span className="tabular-nums text-xs">
                                  {pct(student.accuracy)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 text-center tabular-nums">
                              {num(student.exercisesCompleted)}
                            </td>
                            <td className="py-2.5 text-center">
                              {student.unresolvedMisconceptions > 0 ? (
                                <Badge className={cn('shrink-0', severityStyles.high)}>
                                  {num(student.unresolvedMisconceptions)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  {num(0)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
