'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface StudentSummary {
  id: string;
  displayName: string;
  displayNameAr: string;
  totalExercises: number;
  correctExercises: number;
  accuracyRate: number;
  totalMisconceptions: number;
  unresolvedMisconceptions: number;
}

interface CommonMisconception {
  code: string;
  nameAr: string;
  name: string;
  severity: 'high' | 'medium' | 'low' | null;
  remediationHintAr: string | null;
  occurrences: number;
}

interface ClassStats {
  totalStudents: number;
  averageAccuracy: number;
}

interface StudentsViewProps {
  students: StudentSummary[];
  commonMisconceptions: CommonMisconception[];
  classStats: ClassStats;
  classroomName: string;
  classroomNameAr: string;
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

export function StudentsView({
  students,
  commonMisconceptions,
  classStats,
  classroomName,
  classroomNameAr,
}: StudentsViewProps) {
  const t = useTranslations('teacherStudents');
  const locale = useLocale();

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));
  // Founder requirement 2026-04-14: Latin digits + Latin '%' everywhere.
  const pct = (n: number) => `${n}%`;

  const displayClassName = locale === 'ar' ? classroomNameAr : classroomName;

  /** Chevron for navigating to student detail — respects RTL */
  const NavChevron = locale === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="الطلاب" subtitle={displayClassName} icon={Users} />

      {/* Class Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" aria-hidden="true">
              <Users className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">{t('totalStudents')}</p>
              <p className="text-2xl font-bold leading-tight">{num(classStats.totalStudents)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" aria-hidden="true">
              <TrendingUp className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">{t('classAverage')}</p>
              <p className="text-2xl font-bold leading-tight">{pct(classStats.averageAccuracy)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" aria-hidden="true">
              <AlertTriangle className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">{t('commonMisconceptionsCount')}</p>
              <p className="text-2xl font-bold leading-tight">{num(commonMisconceptions.length)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Student List — takes 2 cols */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('studentList')}</CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('noStudents')}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {students.map((student) => {
                    const name =
                      locale === 'ar'
                        ? student.displayNameAr
                        : student.displayName;

                    const accuracyColor =
                      student.accuracyRate >= 70
                        ? 'text-green-600 dark:text-green-400'
                        : student.accuracyRate >= 40
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400';

                    return (
                      <li key={student.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{name}</p>
                              {student.unresolvedMisconceptions > 0 && (
                                <Badge className={severityStyles.high}>
                                  {num(student.unresolvedMisconceptions)} {t('unresolved')}
                                </Badge>
                              )}
                            </div>
                            <Progress value={student.accuracyRate}>
                              <ProgressLabel className="sr-only">
                                {t('accuracyRate')}
                              </ProgressLabel>
                              <ProgressValue className={accuracyColor}>
                                {() => pct(student.accuracyRate)}
                              </ProgressValue>
                            </Progress>
                            <p className="text-xs text-muted-foreground">
                              {t('exerciseCount', {
                                correct: num(student.correctExercises),
                                total: num(student.totalExercises),
                              })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            render={
                              <Link href={`/dashboard/students/${student.id}`} />
                            }
                            aria-label={t('viewDetails')}
                          >
                            <NavChevron className="size-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Common Misconceptions Alert */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" aria-hidden="true" />
                <CardTitle>{t('commonMisconceptions')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {commonMisconceptions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t('noMisconceptions')}
                </p>
              ) : (
                <ul className="space-y-3">
                  {commonMisconceptions.map((mc) => {
                    const name = locale === 'ar' ? mc.nameAr : mc.name;
                    const severityLabel =
                      mc.severity === 'high'
                        ? t('high')
                        : mc.severity === 'medium'
                          ? t('medium')
                          : t('low');

                    return (
                      <li
                        key={mc.code}
                        className="rounded-lg border border-border p-3 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{name}</p>
                          <Badge
                            className={cn(
                              'shrink-0',
                              severityStyles[mc.severity ?? 'low'],
                            )}
                          >
                            {severityLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('occurrences', { count: num(mc.occurrences) })}
                        </p>
                        {mc.remediationHintAr && locale === 'ar' && (
                          <p className="text-xs text-muted-foreground italic">
                            {mc.remediationHintAr}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
