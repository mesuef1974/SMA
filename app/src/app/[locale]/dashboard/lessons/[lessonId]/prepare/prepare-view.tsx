'use client';

/**
 * PrepareView — client component for generating and viewing lesson plans.
 *
 * Displays lesson information, learning outcomes, and allows the teacher
 * to generate AI-powered lesson plans for each period (1 and 2).
 */

import { useState, useCallback } from 'react';
import {
  BookOpen,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LessonPlanViewer } from '@/components/lesson-plan/lesson-plan-viewer';
import type { LessonPlanData, BloomLevel } from '@/lib/lesson-plans/schema';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types — serializable data passed from the server component
// ---------------------------------------------------------------------------

interface LearningOutcomeData {
  id: string;
  code: string | null;
  descriptionAr: string;
  description: string;
  bloomLevel: string | null;
  sortOrder: number | null;
}

interface ChapterData {
  id: string;
  number: number;
  title: string;
  titleAr: string;
}

interface LessonData {
  id: string;
  titleAr: string;
  title: string;
  number: string;
  periodCount: number;
  pageStartTe: number | null;
  pageEndTe: number | null;
  pageStartSe: number | null;
  pageEndSe: number | null;
  chapter: ChapterData | null;
  learningOutcomes: LearningOutcomeData[];
}

interface ExistingPlan {
  id: string;
  periodNumber: number | null;
  status: string | null;
  sectionData: unknown;
  createdAt: string | null;
}

interface PrepareViewProps {
  lesson: LessonData;
  existingPlans: ExistingPlan[];
}

// ---------------------------------------------------------------------------
// Bloom badge mapping
// ---------------------------------------------------------------------------

const bloomColors: Record<string, string> = {
  remember: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  understand: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  apply: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  analyze: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  evaluate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  create: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

const bloomLabels: Record<string, string> = {
  remember: 'تذكّر',
  understand: 'فهم',
  apply: 'تطبيق',
  analyze: 'تحليل',
  evaluate: 'تقويم',
  create: 'إبداع',
};

// ---------------------------------------------------------------------------
// Error messages by HTTP status
// ---------------------------------------------------------------------------

function getErrorMessage(status: number, fallback: string): string {
  switch (status) {
    case 401:
      return 'غير مصرّح — يرجى تسجيل الدخول وإعادة المحاولة.';
    case 429:
      return 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً ثم إعادة المحاولة.';
    case 503:
      return 'خدمة الذكاء الاصطناعي غير مُهيّأة. يرجى التواصل مع مدير النظام لإضافة مفتاح API.';
    default:
      return fallback || 'حدث خطأ غير متوقع أثناء توليد التحضير. يرجى إعادة المحاولة.';
  }
}

// ---------------------------------------------------------------------------
// Types for generation state
// ---------------------------------------------------------------------------

interface PeriodState {
  loading: boolean;
  error: string | null;
  plan: LessonPlanData | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrepareView({ lesson, existingPlans }: PrepareViewProps) {
  // Initialize period states from existing plans
  const [periodStates, setPeriodStates] = useState<Record<number, PeriodState>>(() => {
    const initial: Record<number, PeriodState> = {};
    for (let p = 1; p <= (lesson.periodCount ?? 2); p++) {
      const existing = existingPlans.find((ep) => ep.periodNumber === p);
      initial[p] = {
        loading: false,
        error: null,
        plan: existing?.sectionData ? (existing.sectionData as LessonPlanData) : null,
      };
    }
    return initial;
  });

  const generatePlan = useCallback(
    async (periodNumber: number) => {
      setPeriodStates((prev) => ({
        ...prev,
        [periodNumber]: { loading: true, error: null, plan: prev[periodNumber]?.plan ?? null },
      }));

      try {
        const res = await fetch('/api/lesson-plans/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: lesson.id,
            periodNumber,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errorMsg = getErrorMessage(
            res.status,
            (data as { error?: string }).error ?? '',
          );
          setPeriodStates((prev) => ({
            ...prev,
            [periodNumber]: { loading: false, error: errorMsg, plan: null },
          }));
          return;
        }

        const result = await res.json();
        const sectionData = result.sectionData as LessonPlanData;

        setPeriodStates((prev) => ({
          ...prev,
          [periodNumber]: { loading: false, error: null, plan: sectionData },
        }));
      } catch {
        setPeriodStates((prev) => ({
          ...prev,
          [periodNumber]: {
            loading: false,
            error: 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.',
            plan: null,
          },
        }));
      }
    },
    [lesson.id],
  );

  const periodCount = lesson.periodCount ?? 2;
  const defaultTab = `period-1`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb-like header */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>الدروس</span>
        <ChevronRight className="size-3.5 rtl:rotate-180" />
        <span>{lesson.chapter?.titleAr ?? ''}</span>
        <ChevronRight className="size-3.5 rtl:rotate-180" />
        <span className="text-foreground font-medium">{lesson.titleAr}</span>
      </div>

      {/* Lesson Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            {lesson.titleAr}
          </CardTitle>
          {lesson.title && (
            <CardDescription dir="ltr" className="text-start">
              {lesson.title}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {lesson.chapter && (
              <div>
                <span className="text-muted-foreground">الفصل:</span>{' '}
                <span className="font-medium">
                  {lesson.chapter.number} — {lesson.chapter.titleAr}
                </span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">رقم الدرس:</span>{' '}
              <span className="font-medium">{lesson.number}</span>
            </div>
            <div>
              <span className="text-muted-foreground">عدد الحصص:</span>{' '}
              <span className="font-medium">{periodCount}</span>
            </div>
            {lesson.pageStartTe && lesson.pageEndTe && (
              <div>
                <span className="text-muted-foreground">دليل المعلم:</span>{' '}
                <span className="font-medium">ص {lesson.pageStartTe}–{lesson.pageEndTe}</span>
              </div>
            )}
            {lesson.pageStartSe && lesson.pageEndSe && (
              <div>
                <span className="text-muted-foreground">كتاب الطالب:</span>{' '}
                <span className="font-medium">ص {lesson.pageStartSe}–{lesson.pageEndSe}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Learning Outcomes */}
      {lesson.learningOutcomes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">مخرجات التعلم</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lesson.learningOutcomes.map((lo) => (
                <li key={lo.id} className="flex items-start gap-3 text-sm">
                  {lo.code && (
                    <Badge variant="outline" className="shrink-0 mt-0.5 font-mono text-xs">
                      {lo.code}
                    </Badge>
                  )}
                  <span className="flex-1">{lo.descriptionAr}</span>
                  {lo.bloomLevel && (
                    <Badge
                      className={cn(
                        'shrink-0',
                        bloomColors[lo.bloomLevel] ?? 'bg-zinc-100 text-zinc-700',
                      )}
                    >
                      {bloomLabels[lo.bloomLevel] ?? lo.bloomLevel}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Period Tabs */}
      <div>
        <h3 className="text-lg font-bold mb-3">تحضير الحصص</h3>

        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {Array.from({ length: periodCount }, (_, i) => i + 1).map((p) => {
              const state = periodStates[p];
              const hasExisting = existingPlans.some((ep) => ep.periodNumber === p);
              return (
                <TabsTrigger key={p} value={`period-${p}`} className="gap-1.5">
                  الحصة {p}
                  {(state?.plan || hasExisting) && (
                    <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Array.from({ length: periodCount }, (_, i) => i + 1).map((p) => {
            const state = periodStates[p] ?? { loading: false, error: null, plan: null };

            return (
              <TabsContent key={p} value={`period-${p}`} className="mt-4">
                {/* Loading State */}
                {state.loading && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                      <Loader2 className="size-10 animate-spin text-primary" />
                      <div className="text-center space-y-1">
                        <p className="font-medium text-lg">جارٍ إعداد التحضير بالذكاء الاصطناعي...</p>
                        <p className="text-sm text-muted-foreground">
                          قد يستغرق هذا من ٣٠ إلى ٦٠ ثانية
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Error State */}
                {!state.loading && state.error && (
                  <Card className="border-red-300 dark:border-red-700">
                    <CardContent className="flex items-start gap-3 py-6">
                      <AlertCircle className="size-5 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                      <div className="space-y-3">
                        <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePlan(p)}
                        >
                          إعادة المحاولة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Plan View */}
                {!state.loading && !state.error && state.plan && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          تم توليد التحضير بنجاح
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePlan(p)}
                      >
                        <Sparkles className="size-3.5" />
                        إعادة التوليد
                      </Button>
                    </div>
                    <LessonPlanViewer plan={state.plan} />
                  </div>
                )}

                {/* Empty State — Generate Button */}
                {!state.loading && !state.error && !state.plan && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="size-8 text-primary" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-medium text-lg">لم يتم تحضير هذه الحصة بعد</p>
                        <p className="text-sm text-muted-foreground">
                          اضغط الزر لتوليد التحضير بالذكاء الاصطناعي
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="gap-2"
                        onClick={() => generatePlan(p)}
                      >
                        <Sparkles className="size-4" />
                        توليد التحضير — الحصة {p}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
