'use client';

/**
 * InteractiveDataReveal — progressive disclosure of statistical operations
 * over a raw data array. Steps are chained: each button enables the next.
 *
 * Operations supported: 'sort' | 'median' | 'iqr' | 'mean'
 * All numbers render in Latin numerals.
 */

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type Op = 'sort' | 'median' | 'iqr' | 'mean';

interface InteractiveDataRevealProps {
  data: number[];
  operations: Op[];
  label?: string;
}

const OP_LABEL: Record<Op, string> = {
  sort: 'رتِّب',
  median: 'الوسيط',
  iqr: 'المدى الربيعي IQR',
  mean: 'الوسط الحسابي',
};

function sortAsc(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

function medianIndices(n: number): number[] {
  if (n === 0) return [];
  const mid = (n - 1) / 2;
  if (Number.isInteger(mid)) return [mid];
  return [Math.floor(mid), Math.ceil(mid)];
}

function quartileBounds(n: number): { q1Lo: number; q1Hi: number; q3Lo: number; q3Hi: number } {
  // Inclusive mid-half window: Q1..Q3 spans the central 50% (indexes).
  const lower = Math.floor((n - 1) * 0.25);
  const upper = Math.ceil((n - 1) * 0.75);
  return { q1Lo: lower, q1Hi: lower, q3Lo: upper, q3Hi: upper };
}

export function InteractiveDataReveal({ data, operations, label }: InteractiveDataRevealProps) {
  const [step, setStep] = useState(0); // how many operations have been applied

  const sorted = useMemo(() => sortAsc(data), [data]);
  const sortedActive = step >= 1 && operations.includes('sort');
  const display = sortedActive ? sorted : data;

  const medianOpIndex = operations.indexOf('median');
  const iqrOpIndex = operations.indexOf('iqr');
  const meanOpIndex = operations.indexOf('mean');

  const medianActive = medianOpIndex >= 0 && step > medianOpIndex && sortedActive;
  const iqrActive = iqrOpIndex >= 0 && step > iqrOpIndex && sortedActive;
  const meanActive = meanOpIndex >= 0 && step > meanOpIndex;

  const medIdx = medianIndices(sorted.length);
  const { q1Lo, q3Hi } = quartileBounds(sorted.length);

  const medianValue = useMemo(() => {
    if (!medIdx.length) return null;
    const vals = medIdx.map((i) => sorted[i]);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [medIdx, sorted]);

  const meanValue = useMemo(() => {
    if (!sorted.length) return null;
    return sorted.reduce((a, b) => a + b, 0) / sorted.length;
  }, [sorted]);

  const iqrValue = useMemo(() => {
    if (!sorted.length) return null;
    return sorted[q3Hi] - sorted[q1Lo];
  }, [sorted, q1Lo, q3Hi]);

  const reset = () => setStep(0);

  return (
    <div className="space-y-6">
      {label && <p className="text-xl text-zinc-300 text-center">{label}</p>}

      {/* Chips */}
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        dir="ltr"
        role="list"
        aria-label="قيم البيانات"
      >
        {display.map((v, i) => {
          const isMedian = medianActive && medIdx.includes(i);
          const inIqr = iqrActive && i >= q1Lo && i <= q3Hi;
          return (
            <span
              key={`${v}-${i}`}
              role="listitem"
              className={cn(
                'inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xl font-mono transition-all duration-300',
                isMedian
                  ? 'border-[color:var(--sma-qamar-500)] bg-[color:var(--sma-qamar-500)]/25 text-[color:var(--sma-qamar-500)] font-bold scale-110'
                  : inIqr
                    ? 'border-blue-500/60 bg-blue-500/15 text-blue-200'
                    : 'border-white/20 bg-white/5 text-zinc-200',
              )}
            >
              {v}
            </span>
          );
        })}
      </div>

      {/* Readouts */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-lg">
        {medianActive && medianValue != null && (
          <span className="rounded-lg bg-[color:var(--sma-qamar-500)]/20 border border-[color:var(--sma-qamar-500)]/60 px-3 py-1 text-[color:var(--sma-qamar-500)]">
            الوسيط <span dir="ltr" className="font-mono">= {medianValue}</span>
          </span>
        )}
        {iqrActive && iqrValue != null && (
          <span className="rounded-lg bg-blue-500/20 border border-blue-500/60 px-3 py-1 text-blue-200">
            IQR <span dir="ltr" className="font-mono">= {iqrValue}</span>
          </span>
        )}
        {meanActive && meanValue != null && (
          <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/60 px-3 py-1 text-emerald-200">
            الوسط <span dir="ltr" className="font-mono">= {Math.round(meanValue * 100) / 100}</span>
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {operations.map((op, i) => {
          const unlocked = i <= step;
          const done = i < step;
          return (
            <button
              key={op}
              type="button"
              onClick={() => unlocked && !done && setStep(i + 1)}
              disabled={!unlocked || done}
              className={cn(
                'rounded-lg px-4 py-2 text-base font-medium transition-colors',
                done
                  ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/50'
                  : unlocked
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/10',
              )}
            >
              {done ? '✓ ' : ''}
              {OP_LABEL[op]}
            </button>
          );
        })}
        {step > 0 && (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-400 hover:bg-white/10"
          >
            ↺ إعادة
          </button>
        )}
      </div>
    </div>
  );
}
