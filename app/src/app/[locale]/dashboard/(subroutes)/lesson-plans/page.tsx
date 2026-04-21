import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, BookOpen } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getLessonPlansByTeacher } from '@/db/queries/lesson-plans';
import { PageHeader } from '@/components/dashboard/page-header';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  void locale;
  return { title: 'خطط الدروس' };
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

type PlanStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'archived'
  // DEC-SMA-045: plan failed Triple-Gate / source-traceability validation.
  | 'rejected_gate';

const STATUS_ORDER: PlanStatus[] = [
  'approved',
  'in_review',
  'draft',
  'rejected_gate',
  'archived',
];

const STATUS_LABEL: Record<PlanStatus, string> = {
  approved: 'معتمدة',
  in_review: 'قيد المراجعة',
  draft: 'مسودة',
  archived: 'مؤرشفة',
  rejected_gate: 'مرفوضة (فشل التحقق)',
};

interface BadgeStyle {
  background: string;
  color: string;
  border: string;
}

const STATUS_STYLE: Record<PlanStatus, BadgeStyle> = {
  approved: {
    background: 'color-mix(in srgb, var(--sma-najm-700) 12%, transparent)',
    color: 'var(--sma-najm-700)',
    border: 'color-mix(in srgb, var(--sma-najm-700) 25%, transparent)',
  },
  in_review: {
    background: 'color-mix(in srgb, oklch(0.75 0.18 85) 15%, transparent)',
    color: 'oklch(0.45 0.14 85)',
    border: 'color-mix(in srgb, oklch(0.75 0.18 85) 30%, transparent)',
  },
  draft: {
    background: 'color-mix(in srgb, var(--muted-foreground) 10%, transparent)',
    color: 'var(--muted-foreground)',
    border: 'color-mix(in srgb, var(--muted-foreground) 20%, transparent)',
  },
  archived: {
    background: 'color-mix(in srgb, var(--muted-foreground) 6%, transparent)',
    color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)',
    border: 'color-mix(in srgb, var(--muted-foreground) 12%, transparent)',
  },
  rejected_gate: {
    background: 'color-mix(in srgb, oklch(0.7 0.19 25) 12%, transparent)',
    color: 'oklch(0.45 0.18 25)',
    border: 'color-mix(in srgb, oklch(0.7 0.19 25) 30%, transparent)',
  },
};

// ---------------------------------------------------------------------------
// Arabic date formatter
// ---------------------------------------------------------------------------

function formatDateAr(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Period number → Arabic ordinal
// ---------------------------------------------------------------------------

const PERIOD_LABELS: Record<number, string> = {
  1: 'الحصة الأولى',
  2: 'الحصة الثانية',
  3: 'الحصة الثالثة',
  4: 'الحصة الرابعة',
  5: 'الحصة الخامسة',
};

function periodLabel(n: number | null | undefined): string {
  if (!n) return '';
  return PERIOD_LABELS[n] ?? `الحصة ${n}`;
}

// ---------------------------------------------------------------------------
// Section-data type (partial — only what we display)
// ---------------------------------------------------------------------------

interface SectionDataHeader {
  lesson_title_ar?: string;
  unit_number?: string | number;
  period?: string | number;
}

interface SectionData {
  header?: SectionDataHeader;
  learning_outcomes?: unknown[];
}

function getSectionData(raw: unknown): SectionData {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as SectionData;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function LessonPlansPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;
  const plans = await getLessonPlansByTeacher(teacherId);

  // Group by status in priority order
  const grouped = STATUS_ORDER.reduce<
    Record<PlanStatus, typeof plans>
  >(
    (acc, s) => {
      acc[s] = plans.filter((p) => p.status === s);
      return acc;
    },
    { approved: [], in_review: [], draft: [], archived: [], rejected_gate: [] },
  );

  const totalCount = plans.length;

  return (
    <div dir="rtl" className="space-y-8">
      <PageHeader
        icon={FileText}
        title="خطط الدروس"
        subtitle={
          totalCount === 0
            ? 'لا توجد خطط دروس'
            : `${totalCount} خطة درس`
        }
      />

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
          <div
            className="mb-4 flex size-16 items-center justify-center rounded-2xl"
            style={{
              background: 'color-mix(in srgb, var(--sma-najm-700) 8%, transparent)',
            }}
          >
            <BookOpen
              className="size-8"
              style={{ color: 'var(--sma-najm-700)' }}
            />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            لم تقم بإنشاء أي خطط دروس بعد
          </h2>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            ابدأ بتصفح الدروس وإنشاء خطة درس لكل حصة
          </p>
          <Link
            href={`/${locale}/dashboard/lessons`}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--sma-najm-700)' }}
          >
            استعراض الدروس
          </Link>
        </div>
      )}

      {/* Grouped sections */}
      {totalCount > 0 &&
        STATUS_ORDER.map((status) => {
          const group = grouped[status];
          if (group.length === 0) return null;

          return (
            <section key={status} className="space-y-4">
              {/* Section heading */}
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  {STATUS_LABEL[status]}
                </h2>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    background: STATUS_STYLE[status].background,
                    color: STATUS_STYLE[status].color,
                    border: `1px solid ${STATUS_STYLE[status].border}`,
                  }}
                >
                  {group.length}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Cards grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((plan) => {
                  const sd = getSectionData(plan.sectionData);
                  const titleAr =
                    sd.header?.lesson_title_ar ||
                    plan.lesson?.titleAr ||
                    plan.lesson?.title ||
                    'درس بدون عنوان';
                  const chapterName =
                    plan.lesson?.chapter?.titleAr ||
                    plan.lesson?.chapter?.title ||
                    '';
                  const planStatus = (plan.status ?? 'draft') as PlanStatus;
                  const style = STATUS_STYLE[planStatus] ?? STATUS_STYLE.draft;

                  return (
                    <article
                      key={plan.id}
                      className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      {/* Status badge */}
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            background: style.background,
                            color: style.color,
                            border: `1px solid ${style.border}`,
                          }}
                        >
                          {STATUS_LABEL[planStatus]}
                        </span>

                        {plan.humanReviewed && (
                          <span className="text-xs text-muted-foreground">
                            ✓ مراجع
                          </span>
                        )}
                      </div>

                      {/* Lesson title */}
                      <h3 className="mb-1 text-sm font-bold leading-snug text-foreground line-clamp-2">
                        {titleAr}
                      </h3>

                      {/* Chapter name */}
                      {chapterName && (
                        <p className="mb-3 text-xs text-muted-foreground line-clamp-1">
                          {chapterName}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-muted-foreground">
                        {plan.periodNumber && (
                          <span>{periodLabel(plan.periodNumber)}</span>
                        )}
                        {plan.createdAt && (
                          <span dir="ltr" className="ltr:text-right">
                            {formatDateAr(plan.createdAt)}
                          </span>
                        )}
                      </div>

                      {/* Action */}
                      <div className="mt-4 border-t border-border pt-4">
                        <Link
                          href={`/${locale}/dashboard/lesson-plans/${plan.id}`}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          عرض الخطة
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
    </div>
  );
}
