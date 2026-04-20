'use client';

/**
 * AdvisorActionBar — DEC-SMA-037 (P1.2 rubric update)
 *
 * Action strip shown on the lesson plan detail page to academic advisors.
 * Collects a 5-criteria rubric (1-5 each) + optional comment, then submits
 * an Approve / Request Changes / Reject decision. On success, reloads the
 * page so the server-rendered badges update.
 *
 * P1.2 adds:
 *   - 5 rating cards (1-5 each)
 *   - Optional textarea comment (recommended when any rating < 4)
 *   - Three-button decision: Approve / Request Changes / Reject
 *     (Request Changes is wired in UI but normalized to 'rejected' in the
 *     backend until P1.3 ships the dedicated workflow.)
 */

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, RefreshCw } from 'lucide-react';

type AdvisorGate = 'pending' | 'approved' | 'needs_revision';
type Decision = 'approved' | 'rejected' | 'request_changes';

interface RubricScores {
  scientific_accuracy: number;
  qncf_alignment: number;
  pedagogical_flow: number;
  assessment_quality: number;
  language_clarity: number;
}

interface Props {
  planId: string;
  initialGate: AdvisorGate;
  reviewerName: string | null;
  reviewedAt: string | null;
  notes: string | null;
  /** Previous rubric (if the plan has been reviewed before). */
  initialRubric?: RubricScores | null;
  /** Previous structured comment. */
  initialComment?: string | null;
}

const GATE_LABEL: Record<AdvisorGate, string> = {
  pending: 'بانتظار المراجعة',
  approved: 'مُعتَمد',
  needs_revision: 'مرفوض',
};

type CriterionKey = keyof RubricScores;

interface Criterion {
  key: CriterionKey;
  label: string;
  description: string;
}

const CRITERIA: Criterion[] = [
  {
    key: 'scientific_accuracy',
    label: 'الدقة العلمية',
    description: 'دقة المحتوى الرياضي والمفاهيم والرموز والصياغات.',
  },
  {
    key: 'qncf_alignment',
    label: 'التوافق مع QNCF',
    description: 'مطابقة معايير المناهج القطرية (QNCF) ومخرجات التعلّم.',
  },
  {
    key: 'pedagogical_flow',
    label: 'التسلسل التربوي',
    description: 'تدرّج Bloom ومنطق الشرح والربط بين الأقسام.',
  },
  {
    key: 'assessment_quality',
    label: 'جودة التقييم',
    description: 'تنوّع الأسئلة (MC + items)، الصياغة، ومستوى التحدّي.',
  },
  {
    key: 'language_clarity',
    label: 'الوضوح اللغوي',
    description: 'عربية فصحى سليمة ومصطلحات رياضية موحّدة.',
  },
];

const DEFAULT_RATING = 4;

export function AdvisorActionBar({
  planId,
  initialGate,
  reviewerName,
  reviewedAt,
  notes,
  initialRubric,
  initialComment,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [rubric, setRubric] = useState<RubricScores>(() => ({
    scientific_accuracy: initialRubric?.scientific_accuracy ?? DEFAULT_RATING,
    qncf_alignment: initialRubric?.qncf_alignment ?? DEFAULT_RATING,
    pedagogical_flow: initialRubric?.pedagogical_flow ?? DEFAULT_RATING,
    assessment_quality: initialRubric?.assessment_quality ?? DEFAULT_RATING,
    language_clarity: initialRubric?.language_clarity ?? DEFAULT_RATING,
  }));
  const [comment, setComment] = useState<string>(initialComment ?? '');

  const lowRating = useMemo(
    () => Object.values(rubric).some((v) => v < 4),
    [rubric],
  );

  const commentAdvisable = lowRating && comment.trim().length === 0;

  async function submit(decision: Decision) {
    setError(null);

    const res = await fetch(`/api/lesson-plans/${planId}/advisor-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        notes: comment.trim() || undefined,
        rubric_scores: rubric,
        comment: comment.trim() || undefined,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'فشل تسجيل القرار. حاول مرة أخرى.');
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
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

      {/* Previous notes (legacy field) */}
      {notes && initialGate === 'needs_revision' && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
          <div className="mb-1 text-xs font-semibold text-muted-foreground">
            ملاحظات المراجع السابق
          </div>
          <p className="whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Rubric cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          معايير التقييم (1 = ضعيف، 5 = ممتاز)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CRITERIA.map((c) => (
            <CriterionCard
              key={c.key}
              criterion={c}
              value={rubric[c.key]}
              onChange={(v) =>
                setRubric((prev) => ({ ...prev, [c.key]: v }))
              }
              disabled={pending}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label
          htmlFor="advisor-comment"
          className="block text-sm font-medium text-foreground"
        >
          تعليق المراجع{' '}
          <span className="text-xs text-muted-foreground">
            (اختياري — يُنصَح به عند أي تقييم أقل من 4)
          </span>
        </label>
        <textarea
          id="advisor-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={4000}
          disabled={pending}
          className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--sma-najm-700)] disabled:opacity-50"
          placeholder="ملاحظات المحتوى، نقاط القوة، وما يحتاج تعديلاً…"
        />
        {commentAdvisable && (
          <p className="text-xs" style={{ color: 'var(--destructive)' }}>
            يُنصَح بإضافة تعليق يوضّح سبب التقييم المنخفض.
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
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
          onClick={() => submit('request_changes')}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          title="طلب تعديلات (سيُفعَّل بالكامل في P1.3)"
        >
          <RefreshCw className="size-4" />
          <span>طلب تعديلات</span>
        </button>

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
          <X className="size-4" />
          <span>رفض</span>
        </button>

        {pending && (
          <span className="text-xs text-muted-foreground">جارِ الحفظ…</span>
        )}
      </div>

      {error && (
        <p
          className="text-sm"
          style={{ color: 'var(--destructive)' }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CriterionCard
// ---------------------------------------------------------------------------

function CriterionCard({
  criterion,
  value,
  onChange,
  disabled,
}: {
  criterion: Criterion;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const groupName = `rubric-${criterion.key}`;
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">
          {criterion.label}
        </h4>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums"
          style={getScoreBadgeStyle(value)}
        >
          {value} / 5
        </span>
      </div>
      <p className="mb-2 text-xs leading-snug text-muted-foreground">
        {criterion.description}
      </p>
      <div
        role="radiogroup"
        aria-label={criterion.label}
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = n === value;
          return (
            <label
              key={n}
              className="flex-1 cursor-pointer"
              aria-label={`${criterion.label} — ${n}`}
            >
              <input
                type="radio"
                name={groupName}
                value={n}
                checked={selected}
                onChange={() => onChange(n)}
                disabled={disabled}
                className="sr-only"
              />
              <span
                className="flex h-8 items-center justify-center rounded-md border text-xs font-semibold transition-colors"
                style={getRatingButtonStyle(selected, n)}
              >
                {n}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

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

function getScoreBadgeStyle(value: number): React.CSSProperties {
  if (value >= 4) {
    return {
      background: 'color-mix(in srgb, var(--success) 15%, transparent)',
      color: 'var(--success)',
    };
  }
  if (value <= 2) {
    return {
      background: 'color-mix(in srgb, var(--destructive) 12%, transparent)',
      color: 'var(--destructive)',
    };
  }
  return {
    background: 'color-mix(in srgb, var(--muted-foreground) 12%, transparent)',
    color: 'var(--muted-foreground)',
  };
}

function getRatingButtonStyle(
  selected: boolean,
  _n: number,
): React.CSSProperties {
  if (!selected) {
    return {
      background: 'transparent',
      color: 'var(--muted-foreground)',
      borderColor: 'var(--border)',
    };
  }
  return {
    background: 'var(--sma-najm-700)',
    color: 'var(--primary-foreground)',
    borderColor: 'var(--sma-najm-700)',
  };
}
