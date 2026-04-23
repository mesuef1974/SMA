'use client';

/**
 * AdvisorFeedbackPanel — shows the latest advisor review for a lesson plan.
 *
 * Fetches `/api/lesson-plans/{planId}/reviews` client-side on mount when
 * the plan is in a reviewed state (approved | changes_requested | rejected)
 * and renders a semantic Card (green/amber/red) with the latest decision,
 * advisor comment, rubric scores (for changes_requested), reviewer name +
 * timestamp, and a link to the full history drawer on the lesson-plan page.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, XCircle, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Decision = 'approved' | 'rejected' | 'changes_requested';

interface RubricScores {
  scientific_accuracy?: number;
  qncf_alignment?: number;
  pedagogical_flow?: number;
  assessment_quality?: number;
  language_clarity?: number;
}

interface ReviewRow {
  id: string;
  decision: Decision;
  comment: string | null;
  rubricScores: RubricScores | null;
  createdAt: string;
  reviewer: {
    id: string;
    fullName: string;
    fullNameAr: string | null;
    email: string;
    role: string;
  } | null;
}

const RUBRIC_LABELS: Record<keyof RubricScores, string> = {
  scientific_accuracy: 'الدقة العلمية',
  qncf_alignment: 'مواءمة QNCF',
  pedagogical_flow: 'التسلسل التربوي',
  assessment_quality: 'جودة التقييم',
  language_clarity: 'وضوح اللغة',
};

interface Props {
  planId: string;
  status: 'approved' | 'changes_requested' | 'rejected';
  /** e.g. "ar" — used to build the lesson-plan detail link. */
  locale: string;
}

export function AdvisorFeedbackPanel({ planId, status, locale }: Props) {
  const [review, setReview] = useState<ReviewRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/lesson-plans/${planId}/reviews`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return (await res.json()) as { reviews: ReviewRow[] };
      })
      .then((body) => {
        if (cancelled) return;
        const sorted = [...body.reviews].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setReview(sorted[0] ?? null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'فشل تحميل المراجعة');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [planId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          جارٍ تحميل ملاحظات المستشار…
        </CardContent>
      </Card>
    );
  }

  if (error || !review) {
    // Silent fallback — we don't want to block the plan view if reviews
    // can't load. Show a minimal inline note.
    return null;
  }

  const name =
    review.reviewer?.fullNameAr ?? review.reviewer?.fullName ?? 'المستشار';
  const when = new Date(review.createdAt).toLocaleString('ar-QA');

  const meta = {
    approved: {
      label: 'تمت الموافقة',
      Icon: CheckCircle2,
      className:
        'border-success/40 bg-success/10 text-success-foreground [&_[data-icon]]:text-success',
      badge: <Badge variant="success">معتمدة</Badge>,
      prefix: '\u2713',
    },
    changes_requested: {
      label: 'طلب تعديلات',
      Icon: AlertTriangle,
      className:
        'border-warning/40 bg-warning/10 text-warning-foreground [&_[data-icon]]:text-warning',
      badge: <Badge variant="warning">تعديلات مطلوبة</Badge>,
      prefix: '\u26A0',
    },
    rejected: {
      label: 'مرفوض',
      Icon: XCircle,
      className:
        'border-destructive/40 bg-destructive/10 text-destructive-foreground [&_[data-icon]]:text-destructive',
      badge: <Badge variant="destructive">مرفوضة</Badge>,
      prefix: '\u2717',
    },
  }[status];

  const { Icon } = meta;

  return (
    <Card className={cn('border-s-4', meta.className)}>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon data-icon className="size-5 shrink-0" />
            <span className="font-semibold">
              {meta.prefix} {meta.label}
            </span>
            {meta.badge}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="font-medium text-foreground">{name}</span>
            <span dir="ltr">{when}</span>
          </div>
        </div>

        {review.comment && (
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {review.comment}
          </p>
        )}

        {status === 'changes_requested' && review.rubricScores && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {(Object.keys(RUBRIC_LABELS) as (keyof RubricScores)[]).map((k) => {
              const v = review.rubricScores?.[k];
              if (v === undefined) return null;
              return (
                <div
                  key={k}
                  className="flex items-center justify-between rounded-lg bg-background/60 px-2 py-1"
                >
                  <span className="text-muted-foreground">
                    {RUBRIC_LABELS[k]}
                  </span>
                  <span className="font-semibold">{v}/5</span>
                </div>
              );
            })}
          </div>
        )}

        <div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            render={
              <Link
                href={`/${locale}/dashboard/lesson-plans/${planId}`}
              />
            }
          >
            <History className="size-3.5" />
            اعرض السجل الكامل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
