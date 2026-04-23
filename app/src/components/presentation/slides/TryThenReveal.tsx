'use client';

/**
 * TryThenReveal — a practice/assess prompt where the student tries first and
 * the solution is gated by the teacher's revealLevel.
 *
 *   L0: question + input only
 *   L1: question + input + hint (if provided)
 *   L2: question + input + solution steps + expected answer
 *
 * Feedback is color-blind safe: ✓ in a circle (emerald) / ✗ in a triangle (red).
 */

import { useMemo, useState } from 'react';
import { useTeacherMode } from '../teacher-mode-context';
import { MathText } from '@/components/math/math-display';
import { cn } from '@/lib/utils';

interface TryThenRevealProps {
  question: string;
  expectedAnswer: string | number;
  solutionSteps?: string[];
  hint?: string;
}

function normalize(v: string): string {
  return v
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[،,]/g, ',')
    .toLowerCase();
}

function isNumericMatch(input: string, expected: string | number): boolean {
  const n = Number.parseFloat(input.replace(',', '.'));
  if (!Number.isFinite(n)) return false;
  const exp =
    typeof expected === 'number'
      ? expected
      : Number.parseFloat(String(expected).replace(',', '.'));
  if (!Number.isFinite(exp)) return false;
  return Math.abs(n - exp) < 1e-6;
}

export function TryThenReveal({
  question,
  expectedAnswer,
  solutionSteps,
  hint,
}: TryThenRevealProps) {
  const { isTeacher, revealLevel } = useTeacherMode();
  const [value, setValue] = useState('');
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const expectedStr = useMemo(() => String(expectedAnswer), [expectedAnswer]);

  const showHint = isTeacher && revealLevel >= 1 && Boolean(hint);
  const showSolution = isTeacher && revealLevel >= 2;

  const check = () => {
    if (!value.trim()) return;
    const ok =
      isNumericMatch(value, expectedAnswer) ||
      normalize(value) === normalize(expectedStr);
    setState(ok ? 'correct' : 'wrong');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-2xl leading-relaxed md:text-3xl">
        <MathText text={question} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="try-reveal-input">
          إجابتك
        </label>
        <input
          id="try-reveal-input"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (state !== 'idle') setState('idle');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') check();
          }}
          dir="ltr"
          placeholder="اكتب إجابتك…"
          className="flex-1 min-w-[180px] rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-xl text-white placeholder:text-zinc-500 focus:border-[color:var(--sma-qamar-500)] focus:outline-none"
          aria-invalid={state === 'wrong'}
        />
        <button
          type="button"
          onClick={check}
          className="rounded-lg bg-white/15 px-5 py-3 text-lg font-medium text-white hover:bg-white/25"
        >
          تحقق
        </button>
      </div>

      {state === 'correct' && (
        <div
          className="flex items-center gap-2 rounded-lg bg-emerald-900/30 border border-emerald-500/50 px-4 py-2 text-emerald-200"
          role="status"
        >
          <span
            aria-hidden
            className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-500 text-black font-bold"
          >
            ✓
          </span>
          <span>إجابة صحيحة</span>
        </div>
      )}
      {state === 'wrong' && (
        <div
          className="flex items-center gap-2 rounded-lg bg-red-900/30 border border-red-500/50 px-4 py-2 text-red-200"
          role="status"
        >
          <span
            aria-hidden
            className={cn(
              'inline-flex size-6 items-center justify-center text-red-200',
              // color-blind safe: shape (triangle) + label
            )}
            style={{
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              background: 'currentColor',
            }}
          >
            <span className="sr-only">خطأ</span>
            <span className="text-black font-bold translate-y-[2px]" aria-hidden>
              !
            </span>
          </span>
          <span>حاول مرة أخرى</span>
        </div>
      )}

      {showHint && hint && (
        <div className="rounded-xl bg-[color:var(--sma-qamar-500)]/15 border border-[color:var(--sma-qamar-500)]/50 p-4 text-lg">
          <span className="font-bold text-[color:var(--sma-qamar-500)] me-2">تلميح:</span>
          <MathText text={hint} />
        </div>
      )}

      {showSolution && (
        <div className="rounded-xl bg-emerald-900/20 border border-emerald-700/50 p-5 text-lg space-y-3">
          <div>
            <span className="font-bold text-emerald-300 me-2">الإجابة المتوقعة:</span>
            <MathText text={expectedStr} />
          </div>
          {solutionSteps && solutionSteps.length > 0 && (
            <ol className="list-decimal ps-5 space-y-1 text-emerald-100/90">
              {solutionSteps.map((s, i) => (
                <li key={i}>
                  <MathText text={s} />
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
