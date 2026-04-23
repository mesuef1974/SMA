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
  Presentation,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LessonPlanViewer } from '@/components/lesson-plan/lesson-plan-viewer';
import { VisualAids51 } from '@/components/lesson-plan/visual-aids-5-1';
import { SubmitForReviewButton } from '@/components/lesson-plan/submit-for-review-button';
import { AdvisorFeedbackPanel } from '@/components/lesson-plan/advisor-feedback-panel';
import type { LessonPlanData } from '@/lib/lesson-plans/schema';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Plan status — mirrors the DB enum for lesson_plans.status
// ---------------------------------------------------------------------------

type PlanStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected';

const STATUS_BADGE: Record<
  Exclude<PlanStatus, 'draft'>,
  { label: string; variant: 'info' | 'warning' | 'success' | 'destructive' }
> = {
  in_review: { label: 'قيد المراجعة', variant: 'info' },
  changes_requested: { label: 'تعديلات مطلوبة', variant: 'warning' },
  approved: { label: 'معتمدة', variant: 'success' },
  rejected: { label: 'مرفوضة', variant: 'destructive' },
};

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

// BL-027 — shape of a serialized review row passed from the server. Kept
// in sync with the API response in /api/lesson-plans/[id]/reviews.
export interface SerializedReview {
  id: string;
  decision: 'approved' | 'rejected' | 'changes_requested';
  comment: string | null;
  rubricScores: {
    scientific_accuracy?: number;
    qncf_alignment?: number;
    pedagogical_flow?: number;
    assessment_quality?: number;
    language_clarity?: number;
  } | null;
  createdAt: string;
  reviewer: {
    id: string;
    fullName: string;
    fullNameAr: string | null;
    email: string;
    role: string;
  } | null;
}

interface PrepareViewProps {
  lesson: LessonData;
  existingPlans: ExistingPlan[];
  /**
   * BL-027 — latest advisor review per plan, fetched server-side to avoid
   * the "loading ملاحظات المستشار…" flicker. Maps planId → review | null.
   */
  initialReviews?: Record<string, SerializedReview | null>;
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
  planId: string | null;
  status: PlanStatus | null;
}

function normalizeStatus(raw: string | null | undefined): PlanStatus | null {
  if (!raw) return null;
  if (
    raw === 'draft' ||
    raw === 'in_review' ||
    raw === 'changes_requested' ||
    raw === 'approved' ||
    raw === 'rejected'
  ) {
    return raw;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrepareView({
  lesson,
  existingPlans,
  initialReviews,
}: PrepareViewProps) {
  const pathname = usePathname();
  // Derive the present URL from the current prepare path
  // e.g. /ar/dashboard/lessons/xyz/prepare → /ar/dashboard/lessons/xyz/present
  const presentBasePath = pathname.replace(/\/prepare\/?$/, '/present');
  // Extract locale (first non-empty segment) for in-app links.
  const locale = pathname.split('/').filter(Boolean)[0] ?? 'ar';

  // Initialize period states from existing plans
  const [periodStates, setPeriodStates] = useState<Record<number, PeriodState>>(() => {
    const initial: Record<number, PeriodState> = {};
    for (let p = 1; p <= (lesson.periodCount ?? 2); p++) {
      const existing = existingPlans.find((ep) => ep.periodNumber === p);
      initial[p] = {
        loading: false,
        error: null,
        plan: existing?.sectionData ? (existing.sectionData as LessonPlanData) : null,
        planId: existing?.id ?? null,
        status: normalizeStatus(existing?.status),
      };
    }
    return initial;
  });

  const generatePlan = useCallback(
    async (periodNumber: number) => {
      setPeriodStates((prev) => ({
        ...prev,
        [periodNumber]: {
          loading: true,
          error: null,
          plan: prev[periodNumber]?.plan ?? null,
          planId: prev[periodNumber]?.planId ?? null,
          status: prev[periodNumber]?.status ?? null,
        },
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
            [periodNumber]: {
              loading: false,
              error: errorMsg,
              plan: null,
              planId: prev[periodNumber]?.planId ?? null,
              status: prev[periodNumber]?.status ?? null,
            },
          }));
          return;
        }

        const result = await res.json();
        const sectionData = result.sectionData as LessonPlanData;
        const newPlanId =
          typeof (result as { id?: unknown }).id === 'string'
            ? ((result as { id: string }).id)
            : null;
        const newStatus = normalizeStatus(
          (result as { status?: string | null }).status ?? null,
        );

        setPeriodStates((prev) => ({
          ...prev,
          [periodNumber]: {
            loading: false,
            error: null,
            plan: sectionData,
            planId: newPlanId ?? prev[periodNumber]?.planId ?? null,
            // After a fresh generate/regenerate the server writes a draft.
            // Default to 'draft' if the server didn't return the status.
            status: newStatus ?? 'draft',
          },
        }));
      } catch {
        setPeriodStates((prev) => ({
          ...prev,
          [periodNumber]: {
            loading: false,
            error: 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.',
            plan: null,
            planId: prev[periodNumber]?.planId ?? null,
            status: prev[periodNumber]?.status ?? null,
          },
        }));
      }
    },
    [lesson.id],
  );

  const handleUseTemplate = useCallback(
    async (periodNumber: number) => {
      setPeriodStates((prev) => ({
        ...prev,
        [periodNumber]: {
          loading: true,
          error: null,
          plan: prev[periodNumber]?.plan ?? null,
          planId: prev[periodNumber]?.planId ?? null,
          status: prev[periodNumber]?.status ?? null,
        },
      }));

      try {
        const res = await fetch('/api/lesson-plans/template', {
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
            [periodNumber]: {
              loading: false,
              error: errorMsg,
              plan: null,
              planId: prev[periodNumber]?.planId ?? null,
              status: prev[periodNumber]?.status ?? null,
            },
          }));
          return;
        }

        const result = await res.json();
        const sectionData = result.sectionData as LessonPlanData;
        const newPlanId =
          typeof (result as { id?: unknown }).id === 'string'
            ? ((result as { id: string }).id)
            : null;
        const newStatus = normalizeStatus(
          (result as { status?: string | null }).status ?? null,
        );

        setPeriodStates((prev) => ({
          ...prev,
          [periodNumber]: {
            loading: false,
            error: null,
            plan: sectionData,
            planId: newPlanId ?? prev[periodNumber]?.planId ?? null,
            // After a fresh generate/regenerate the server writes a draft.
            // Default to 'draft' if the server didn't return the status.
            status: newStatus ?? 'draft',
          },
        }));
      } catch {
        setPeriodStates((prev) => ({
          ...prev,
          [periodNumber]: {
            loading: false,
            error: 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.',
            plan: null,
            planId: prev[periodNumber]?.planId ?? null,
            status: prev[periodNumber]?.status ?? null,
          },
        }));
      }
    },
    [lesson.id],
  );

  const TEMPLATE_LESSONS = ['0f3d5c6d-f8e7-4b24-b1e7-528653eafc36'];
  const hasTemplate = TEMPLATE_LESSONS.includes(lesson.id);

  const periodCount = lesson.periodCount ?? 2;
  const defaultTab = `period-1`;

  const hasAnyPlan = existingPlans.length > 0;

  return (
    <div className="space-y-6 p-6">
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

      {/* No-plans banner — surfaces the fact that nothing exists yet so the
          page doesn't look like a silent shell (QA #14, 2026-04-22). */}
      {!hasAnyPlan && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">لا توجد خطط لهذا الدرس بعد</p>
              <p className="text-sm text-muted-foreground">
                ابدأ بتوليد خطة لكل حصّة، أو انتقل للمحرّر لتحضير يدوي.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/ar/lesson-composer?lessonId=${lesson.id}`} />}
            >
              <FileText className="size-3.5" />
              فتح في المحرّر
            </Button>
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
              const statusForBadge = state?.status ?? null;
              const showStatusBadge =
                statusForBadge &&
                statusForBadge !== 'draft' &&
                statusForBadge in STATUS_BADGE;
              return (
                <TabsTrigger key={p} value={`period-${p}`} className="gap-1.5">
                  الحصة {p}
                  {(state?.plan || hasExisting) && !showStatusBadge && (
                    <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400" />
                  )}
                  {showStatusBadge && (
                    <Badge
                      variant={
                        STATUS_BADGE[
                          statusForBadge as Exclude<PlanStatus, 'draft'>
                        ].variant
                      }
                      className="text-[10px] h-4 px-1.5"
                    >
                      {
                        STATUS_BADGE[
                          statusForBadge as Exclude<PlanStatus, 'draft'>
                        ].label
                      }
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Array.from({ length: periodCount }, (_, i) => i + 1).map((p) => {
            const state =
              periodStates[p] ??
              {
                loading: false,
                error: null,
                plan: null,
                planId: null,
                status: null,
              };

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
                          قد يستغرق هذا من 30 إلى 60 ثانية
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
                    {/* Advisor feedback panel — shown when plan has been
                        reviewed at least once (approved / changes_requested
                        / rejected). Fetches latest review client-side. */}
                    {state.planId &&
                      (state.status === 'approved' ||
                        state.status === 'changes_requested' ||
                        state.status === 'rejected') && (
                        <AdvisorFeedbackPanel
                          planId={state.planId}
                          status={state.status}
                          locale={locale}
                          initialReview={initialReviews?.[state.planId] ?? null}
                        />
                      )}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          تم توليد التحضير بنجاح
                        </span>
                        {state.status === 'in_review' && (
                          <Badge variant="info">قيد المراجعة</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {state.planId &&
                          (state.status === 'draft' ||
                            state.status === 'changes_requested') && (
                            <SubmitForReviewButton
                              planId={state.planId}
                              status={state.status}
                              onSubmitted={() => {
                                setPeriodStates((prev) => {
                                  const cur = prev[p];
                                  if (!cur) return prev;
                                  return {
                                    ...prev,
                                    [p]: { ...cur, status: 'in_review' },
                                  };
                                });
                              }}
                            />
                          )}
                        <Button
                          variant="outline"
                          size="sm"
                          render={<Link href={`${presentBasePath}?period=${p}`} />}
                        >
                          <Presentation className="size-3.5" />
                          عرض تقديمي
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePlan(p)}
                        >
                          <Sparkles className="size-3.5" />
                          إعادة التوليد
                        </Button>
                        {hasTemplate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUseTemplate(p)}
                          >
                            <FileText className="size-3.5" />
                            استبدال بالقالب
                          </Button>
                        )}
                      </div>
                    </div>
                    <LessonPlanViewer plan={state.plan} />
                    {lesson.id === '0f3d5c6d-f8e7-4b24-b1e7-528653eafc36' && <VisualAids51 />}
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
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                          size="lg"
                          className="gap-2"
                          onClick={() => generatePlan(p)}
                        >
                          <Sparkles className="size-4" />
                          توليد التحضير — الحصة {p}
                        </Button>
                        {hasTemplate && (
                          <Button
                            size="lg"
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleUseTemplate(p)}
                          >
                            <FileText className="size-4" />
                            استخدام قالب جاهز
                          </Button>
                        )}
                      </div>
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
