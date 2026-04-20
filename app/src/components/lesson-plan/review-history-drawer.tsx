'use client';

/**
 * ReviewHistoryDrawer — P1.3 (DEC-SMA-037 follow-up)
 *
 * Side drawer that shows the append-only history of advisor decisions on
 * a single lesson plan. Data is fetched lazily the first time the drawer
 * opens, then cached for the lifetime of the component.
 *
 * RTL Arabic; closes on backdrop click or Escape.
 */

import { useCallback, useEffect, useState } from 'react';
import { Check, History, RefreshCw, X } from 'lucide-react';

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

interface Props {
  planId: string;
}

const DECISION_META: Record<
  Decision,
  { label: string; color: string; Icon: typeof Check }
> = {
  approved: {
    label: 'مُعتَمد',
    color: 'var(--success)',
    Icon: Check,
  },
  rejected: {
    label: 'مرفوض',
    color: 'var(--destructive)',
    Icon: X,
  },
  changes_requested: {
    label: 'طلب تعديلات',
    color: 'var(--warning)',
    Icon: RefreshCw,
  },
};

const RUBRIC_LABELS: Record<keyof RubricScores, string> = {
  scientific_accuracy: 'الدقة العلمية',
  qncf_alignment: 'مواءمة QNCF',
  pedagogical_flow: 'التسلسل التربوي',
  assessment_quality: 'جودة التقييم',
  language_clarity: 'وضوح اللغة',
};

export function ReviewHistoryDrawer({ planId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/lesson-plans/${planId}/reviews`,
        { cache: 'no-store' },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { reviews: ReviewRow[] };
      setReviews(body.reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل السجل');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  // Load on first open.
  useEffect(() => {
    if (open && reviews === null && !loading) {
      void load();
    }
  }, [open, reviews, loading, load]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
      >
        <History className="size-4" />
        <span>عرض تاريخ المراجعات</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="سجل مراجعات الخطة"
          dir="rtl"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Panel (slides in from the start side under RTL = right) */}
          <div className="relative ms-auto flex h-full w-full max-w-md flex-col border-s bg-background shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <History className="size-5" />
                <h2 className="text-lg font-semibold">سجل المراجعات</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="rounded-lg p-1.5 transition-colors hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <p className="text-sm text-muted-foreground">
                  جاري تحميل السجل…
                </p>
              )}
              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {!loading && !error && reviews && reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  لا توجد مراجعات مسجّلة بعد لهذه الخطة.
                </p>
              )}
              {!loading && !error && reviews && reviews.length > 0 && (
                <ol className="space-y-4">
                  {reviews.map((r) => (
                    <ReviewItem key={r.id} row={r} />
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReviewItem({ row }: { row: ReviewRow }) {
  const meta = DECISION_META[row.decision];
  const { Icon } = meta;
  const name =
    row.reviewer?.fullNameAr ?? row.reviewer?.fullName ?? 'مستشار';
  const when = new Date(row.createdAt).toLocaleString('ar-QA');

  return (
    <li className="rounded-2xl border p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
            color: meta.color,
          }}
        >
          <Icon className="size-3.5" />
          {meta.label}
        </span>
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground" dir="ltr">
          {when}
        </span>
      </div>

      {row.comment && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">
          {row.comment}
        </p>
      )}

      {row.rubricScores && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {(Object.keys(RUBRIC_LABELS) as (keyof RubricScores)[]).map((k) => {
            const v = row.rubricScores?.[k];
            if (v === undefined) return null;
            return (
              <div
                key={k}
                className="flex items-center justify-between rounded-lg bg-muted/50 px-2 py-1"
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
    </li>
  );
}
