import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCheck, BookOpen } from 'lucide-react';

import { auth } from '@/lib/auth';
import { isAdvisor } from '@/lib/advisor';
import { getLessonPlansForAdvisor } from '@/db/queries';
import { PageHeader } from '@/components/dashboard/page-header';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
};

export async function generateMetadata() {
  return { title: 'مراجعة المستشار' };
}

// ---------------------------------------------------------------------------
// sectionData shape we care about
// ---------------------------------------------------------------------------

type AdvisorGate = 'pending' | 'approved' | 'needs_revision';

interface SectionDataHeader {
  lesson_title_ar?: string;
  unit_number?: string | number;
  period?: string | number;
}

interface GateResults {
  advisor_gate?: AdvisorGate;
  advisor_reviewed_at?: string;
}

interface SectionData {
  header?: SectionDataHeader;
  gate_results?: GateResults;
}

function getSectionData(raw: unknown): SectionData {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as SectionData;
  }
  return {};
}

function advisorGateOf(raw: unknown): AdvisorGate {
  const sd = getSectionData(raw);
  return sd.gate_results?.advisor_gate ?? 'pending';
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: 'قيد الانتظار' },
  { key: 'approved', label: 'مُعتَمد' },
  { key: 'rejected', label: 'مرفوض' },
];

function matchesFilter(gate: AdvisorGate, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending') return gate === 'pending';
  if (filter === 'approved') return gate === 'approved';
  if (filter === 'rejected') return gate === 'needs_revision';
  return true;
}

// ---------------------------------------------------------------------------
// Period labels
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
// Badge styles — all via design tokens (no hex)
// ---------------------------------------------------------------------------

interface BadgeStyle {
  background: string;
  color: string;
  border: string;
}

const GATE_STYLE: Record<AdvisorGate, BadgeStyle> = {
  pending: {
    background: 'color-mix(in srgb, var(--muted-foreground) 10%, transparent)',
    color: 'var(--muted-foreground)',
    border: 'color-mix(in srgb, var(--muted-foreground) 20%, transparent)',
  },
  approved: {
    background: 'color-mix(in srgb, var(--success) 15%, transparent)',
    color: 'var(--success)',
    border: 'color-mix(in srgb, var(--success) 30%, transparent)',
  },
  needs_revision: {
    background: 'color-mix(in srgb, var(--destructive) 12%, transparent)',
    color: 'var(--destructive)',
    border: 'color-mix(in srgb, var(--destructive) 25%, transparent)',
  },
};

const GATE_LABEL: Record<AdvisorGate, string> = {
  pending: 'قيد الانتظار',
  approved: 'مُعتَمد',
  needs_revision: 'مرفوض',
};

export default async function AdvisorReviewPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  if (!isAdvisor(session)) {
    redirect(`/${locale}/dashboard`);
  }

  const { filter: filterParam } = await searchParams;
  const filter: FilterKey =
    filterParam === 'pending' ||
    filterParam === 'approved' ||
    filterParam === 'rejected' ||
    filterParam === 'all'
      ? filterParam
      : 'pending';

  const allPlans = await getLessonPlansForAdvisor();
  const plans = allPlans.filter((p) =>
    matchesFilter(advisorGateOf(p.sectionData), filter),
  );

  return (
    <div dir="rtl" className="space-y-6">
      <PageHeader
        icon={ClipboardCheck}
        title="مراجعة المستشار الأكاديمي"
        subtitle={`${plans.length} خطة في الحالة المحددة`}
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={`/${locale}/dashboard/advisor/review?filter=${f.key}`}
              className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
              style={
                active
                  ? {
                      background: 'var(--sma-najm-700)',
                      color: 'var(--primary-foreground)',
                    }
                  : {
                      background: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                    }
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {plans.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
          <div
            className="mb-4 flex size-16 items-center justify-center rounded-2xl"
            style={{
              background: 'color-mix(in srgb, var(--sma-najm-700) 8%, transparent)',
            }}
          >
            <BookOpen className="size-8" style={{ color: 'var(--sma-najm-700)' }} />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            لا توجد خطط في هذه الحالة
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            جرّب تصفية مختلفة أو تحقّق لاحقاً من الخطط الجديدة.
          </p>
        </div>
      )}

      {/* List */}
      {plans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const sd = getSectionData(plan.sectionData);
            const titleAr =
              sd.header?.lesson_title_ar ||
              plan.lesson?.titleAr ||
              plan.lesson?.title ||
              'درس بدون عنوان';
            const chapterName =
              plan.lesson?.chapter?.titleAr || plan.lesson?.chapter?.title || '';
            const gate = sd.gate_results?.advisor_gate ?? 'pending';
            const style = GATE_STYLE[gate];

            return (
              <article
                key={plan.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      background: style.background,
                      color: style.color,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {GATE_LABEL[gate]}
                  </span>
                  {plan.periodNumber && (
                    <span className="text-xs text-muted-foreground">
                      {periodLabel(plan.periodNumber)}
                    </span>
                  )}
                </div>

                <h3 className="mb-1 text-sm font-bold leading-snug text-foreground line-clamp-2">
                  {titleAr}
                </h3>

                {chapterName && (
                  <p className="mb-3 text-xs text-muted-foreground line-clamp-1">
                    {chapterName}
                  </p>
                )}

                <div className="mt-auto border-t border-border pt-4">
                  <Link
                    href={`/${locale}/dashboard/lesson-plans/${plan.id}`}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    فحص
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
