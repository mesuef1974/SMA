'use client';

/**
 * AdvisorActionBar — DEC-SMA-037
 *
 * Action strip shown on the lesson plan detail page to academic advisors.
 * Surfaces the current advisor_gate state and lets the advisor approve
 * or reject the plan (with notes). On success, reloads the page so the
 * server-rendered badges update.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';

type AdvisorGate = 'pending' | 'approved' | 'needs_revision';

interface Props {
  planId: string;
  initialGate: AdvisorGate;
  reviewerName: string | null;
  reviewedAt: string | null;
  notes: string | null;
}

const GATE_LABEL: Record<AdvisorGate, string> = {
  pending: 'بانتظار المراجعة',
  approved: 'مُعتَمد',
  needs_revision: 'مرفوض',
};

export function AdvisorActionBar({
  planId,
  initialGate,
  reviewerName,
  reviewedAt,
  notes,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState(notes ?? '');
  const [error, setError] = useState<string | null>(null);

  async function submit(decision: 'approved' | 'rejected') {
    setError(null);
    const res = await fetch(`/api/lesson-plans/${planId}/advisor-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        notes: decision === 'rejected' ? rejectNotes.trim() || undefined : undefined,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'فشل تسجيل القرار. حاول مرة أخرى.');
      return;
    }

    startTransition(() => {
      router.refresh();
      setShowRejectForm(false);
    });
  }

  return (
    <div
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
      role="region"
      aria-label="شريط مراجعة المستشار"
    >
      {/* Status row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-foreground">
          حالة المراجعة:
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={getBadgeStyle(initialGate)}
        >
          {GATE_LABEL[initialGate]}
        </span>

        {reviewerName && initialGate !== 'pending' && (
          <span className="text-xs text-muted-foreground">
            المراجع: <span className="text-foreground">{reviewerName}</span>
          </span>
        )}

        {reviewedAt && initialGate !== 'pending' && (
          <span className="text-xs text-muted-foreground" dir="ltr">
            {new Date(reviewedAt).toLocaleString('ar-QA')}
          </span>
        )}
      </div>

      {/* Previous notes (if any) */}
      {notes && initialGate === 'needs_revision' && (
        <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
          <div className="mb-1 text-xs font-semibold text-muted-foreground">
            ملاحظات المراجع السابق
          </div>
          <p className="whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit('approved')}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            background: 'var(--success)',
            color: 'var(--success-foreground)',
          }}
        >
          <Check className="size-4" />
          <span>اعتماد</span>
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => setShowRejectForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <X className="size-4" />
          <span>رفض</span>
        </button>

        {pending && (
          <span className="text-xs text-muted-foreground">جارِ الحفظ…</span>
        )}
      </div>

      {/* Reject form */}
      {showRejectForm && (
        <div className="mt-4 space-y-2">
          <label
            htmlFor="advisor-notes"
            className="block text-sm font-medium text-foreground"
          >
            ملاحظات الرفض (اختياري)
          </label>
          <textarea
            id="advisor-notes"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--sma-najm-700)]"
            placeholder="اذكر سبب الرفض وما يحتاج تعديلاً…"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => submit('rejected')}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'var(--destructive)',
                color: 'var(--destructive-foreground)',
              }}
            >
              تأكيد الرفض
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setShowRejectForm(false)}
              className="inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {error && (
        <p
          className="mt-3 text-sm"
          style={{ color: 'var(--destructive)' }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function getBadgeStyle(gate: AdvisorGate): React.CSSProperties {
  if (gate === 'approved') {
    return {
      background: 'color-mix(in srgb, var(--success) 15%, transparent)',
      color: 'var(--success)',
      border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
    };
  }
  if (gate === 'needs_revision') {
    return {
      background: 'color-mix(in srgb, var(--destructive) 12%, transparent)',
      color: 'var(--destructive)',
      border: '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
    };
  }
  return {
    background: 'color-mix(in srgb, var(--muted-foreground) 10%, transparent)',
    color: 'var(--muted-foreground)',
    border: '1px solid color-mix(in srgb, var(--muted-foreground) 20%, transparent)',
  };
}
