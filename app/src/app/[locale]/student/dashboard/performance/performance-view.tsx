'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toArabicIndic } from '@/lib/numerals';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MisconceptionItem {
  id: string;
  code: string;
  nameAr: string;
  name: string;
  severity: 'high' | 'medium' | 'low' | null;
  confidence: number | null;
  resolved: boolean | null;
  remediationHintAr: string | null;
  remediationHint: string | null;
}

interface LessonBreakdownItem {
  lessonId: string | null;
  lessonTitle: string;
  lessonTitleAr: string;
  totalResponses: number;
  correctResponses: number;
  accuracyRate: number;
}

interface PerformanceData {
  totalExercises: number;
  correctExercises: number;
  accuracyRate: number;
  averageScore: number;
  misconceptions: MisconceptionItem[];
  lessonBreakdown: LessonBreakdownItem[];
}

interface PerformanceViewProps {
  studentName: string;
  performance: PerformanceData;
}

// ---------------------------------------------------------------------------
// Severity styles
// ---------------------------------------------------------------------------

const severityStyles: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PerformanceView({ studentName, performance }: PerformanceViewProps) {
  const t = useTranslations('studentPerformance');
  const locale = useLocale();

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));
  const pct = (n: number) =>
    locale === 'ar' ? `${toArabicIndic(n)}٪` : `${n}%`;

  const accuracyColor =
    performance.accuracyRate >= 70
      ? 'text-green-600 dark:text-green-400'
      : performance.accuracyRate >= 40
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        <p className="text-muted-foreground">{t('subtitle', { name: studentName })}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Accuracy Rate */}
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" aria-hidden="true">
              <TrendingUp className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">{t('accuracyRate')}</p>
              <p className={cn('text-2xl font-bold leading-tight', accuracyColor)}>
                {pct(performance.accuracyRate)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Exercises */}
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" aria-hidden="true">
              <BookOpen className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">{t('totalExercises')}</p>
              <p className="text-2xl font-bold leading-tight">{num(performance.totalExercises)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Correct Answers */}
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" aria-hidden="true">
              <CheckCircle className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">{t('correctAnswers')}</p>
              <p className="text-2xl font-bold leading-tight">{num(performance.correctExercises)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Incorrect Answers */}
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" aria-hidden="true">
              <XCircle className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">{t('incorrectAnswers')}</p>
              <p className="text-2xl font-bold leading-tight">
                {num(performance.totalExercises - performance.correctExercises)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content: Misconceptions + Lesson Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Misconceptions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" aria-hidden="true" />
              <CardTitle>{t('detectedMisconceptions')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {performance.misconceptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('noMisconceptions')}
              </p>
            ) : (
              <ul className="space-y-4">
                {performance.misconceptions.map((mc) => {
                  const name = locale === 'ar' ? mc.nameAr : mc.name;
                  const hint =
                    locale === 'ar' ? mc.remediationHintAr : mc.remediationHint;
                  const severityLabel =
                    mc.severity === 'high'
                      ? t('high')
                      : mc.severity === 'medium'
                        ? t('medium')
                        : t('low');

                  return (
                    <li
                      key={mc.id}
                      className="rounded-lg border border-border p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            {mc.code}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {mc.resolved && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              {t('resolved')}
                            </Badge>
                          )}
                          <Badge
                            className={cn(
                              severityStyles[mc.severity ?? 'low'],
                            )}
                          >
                            {severityLabel}
                          </Badge>
                        </div>
                      </div>
                      {hint && (
                        <div className="rounded-md bg-muted/50 p-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {t('remediationHint')}
                          </p>
                          <p className="text-sm">{hint}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Lesson Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-blue-500" aria-hidden="true" />
              <CardTitle>{t('lessonProgress')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {performance.lessonBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t('noLessonData')}
              </p>
            ) : (
              <ul className="space-y-4">
                {performance.lessonBreakdown.map((lb) => {
                  const title =
                    locale === 'ar' ? lb.lessonTitleAr : lb.lessonTitle;

                  return (
                    <li key={lb.lessonId} className="space-y-1.5">
                      <Progress value={lb.accuracyRate}>
                        <ProgressLabel>{title}</ProgressLabel>
                        <ProgressValue>
                          {() => pct(lb.accuracyRate)}
                        </ProgressValue>
                      </Progress>
                      <p className="text-xs text-muted-foreground">
                        {t('lessonStats', {
                          correct: num(lb.correctResponses),
                          total: num(lb.totalResponses),
                        })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
