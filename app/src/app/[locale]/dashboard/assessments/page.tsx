import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClipboardCheck, FileQuestion, BookOpen, Stethoscope } from 'lucide-react';
import { eq, count } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { db } from '@/db';
import { assessments, assessmentQuestions } from '@/db/schema';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  await params;
  return { title: 'التقييمات' };
}

// ---------------------------------------------------------------------------
// Type labels
// ---------------------------------------------------------------------------

const TYPE_LABEL: Record<string, string> = {
  formative: 'تكويني',
  summative: 'ختامي',
  diagnostic: 'تشخيصي',
};

// Tailwind class sets per type — only semantic classes, no hardcoded colors
const TYPE_BADGE_CLASS: Record<string, string> = {
  formative: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  summative: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  diagnostic: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('ar-QA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AssessmentsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;

  // Fetch all assessments for this teacher with question counts
  const rows = await db
    .select({
      id: assessments.id,
      title: assessments.title,
      titleAr: assessments.titleAr,
      type: assessments.type,
      createdAt: assessments.createdAt,
      questionCount: count(assessmentQuestions.id),
    })
    .from(assessments)
    .leftJoin(assessmentQuestions, eq(assessmentQuestions.assessmentId, assessments.id))
    .where(eq(assessments.teacherId, teacherId))
    .groupBy(
      assessments.id,
      assessments.title,
      assessments.titleAr,
      assessments.type,
      assessments.createdAt,
    )
    .orderBy(assessments.createdAt);

  // Reverse so newest first
  const data = [...rows].reverse();

  // Summary counts
  const total = data.length;
  const formativeCount = data.filter((a) => a.type === 'formative').length;
  const summativeCount = data.filter((a) => a.type === 'summative').length;
  const diagnosticCount = data.filter((a) => a.type === 'diagnostic').length;

  return (
    <div dir="rtl" className="space-y-6">
      <PageHeader
        icon={ClipboardCheck}
        title="التقييمات"
        subtitle="جميع التقييمات التي أنشأتها من خلال تحضير الدروس"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="إجمالي التقييمات" value={total} accent="najm" />
        <SummaryCard label="تكوينية" value={formativeCount} accent="blue" />
        <SummaryCard label="ختامية" value={summativeCount} accent="purple" />
        <SummaryCard label="تشخيصية" value={diagnosticCount} accent="amber" />
      </div>

      {/* Assessment list */}
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {data.map((assessment) => {
            const typeKey = assessment.type ?? 'formative';
            const badgeClass = TYPE_BADGE_CLASS[typeKey] ?? TYPE_BADGE_CLASS['formative'];
            const typeLabel = TYPE_LABEL[typeKey] ?? typeKey;

            return (
              <Card key={assessment.id} className="overflow-hidden">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left / top: title + badges */}
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="truncate text-base font-semibold leading-snug">
                      {assessment.titleAr || assessment.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {/* Type badge */}
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
                      >
                        {typeLabel}
                      </span>

                      {/* Question count */}
                      <span className="flex items-center gap-1">
                        <FileQuestion className="size-3.5 opacity-60" />
                        {assessment.questionCount} سؤال
                      </span>

                      {/* Date */}
                      <span className="opacity-60">{formatDate(assessment.createdAt)}</span>
                    </div>
                  </div>

                  {/* Right / bottom: action button */}
                  <div className="shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/dashboard/assessments/${assessment.id}`} />}
                    >
                      عرض التقييم
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (server, no 'use client' needed)
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'najm' | 'blue' | 'purple' | 'amber';
}) {
  const accentStyles: Record<string, { bg: string; text: string }> = {
    najm: {
      bg: 'color-mix(in srgb, var(--sma-najm-700) 8%, transparent)',
      text: 'var(--sma-najm-700)',
    },
    blue: { bg: 'rgb(219 234 254 / 0.6)', text: 'rgb(30 64 175)' },
    purple: { bg: 'rgb(233 213 255 / 0.6)', text: 'rgb(109 40 217)' },
    amber: { bg: 'rgb(254 243 199 / 0.6)', text: 'rgb(146 64 14)' },
  };

  const style = accentStyles[accent];

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl px-4 py-3 text-center"
      style={{ background: style.bg }}
    >
      <span
        className="text-2xl font-bold tabular-nums leading-none"
        style={{ color: style.text }}
      >
        {value}
      </span>
      <span className="mt-1 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <div
        className="mb-4 flex size-14 items-center justify-center rounded-full"
        style={{
          background: 'color-mix(in srgb, var(--sma-najm-700) 10%, transparent)',
        }}
      >
        <BookOpen className="size-7" style={{ color: 'var(--sma-najm-700)' }} />
      </div>
      <p className="text-base font-semibold">لم تقم بإنشاء أي تقييمات بعد</p>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        تُنشأ التقييمات تلقائياً عند تحضير الدروس من خلال خاصية تحضير الحصة
      </p>
    </div>
  );
}
