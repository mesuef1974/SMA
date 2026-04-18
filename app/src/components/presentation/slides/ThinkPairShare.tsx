'use client';

/**
 * ThinkPairShare — three timed phases (think / pair / share) controlled by
 * the teacher. The model answer is hidden from students and revealed only
 * when the teacher sets revealLevel=2.
 */

import { useEffect, useState } from 'react';
import { MathText } from '@/components/math/math-display';
import { useTeacherMode } from '../teacher-mode-context';
import { cn } from '@/lib/utils';

interface ThinkPairShareProps {
  question: string;
  durations?: { think: number; pair: number; share: number }; // seconds
  modelAnswer?: string;
}

const PHASES = ['think', 'pair', 'share'] as const;
type Phase = (typeof PHASES)[number];

const PHASE_LABEL: Record<Phase, string> = {
  think: 'فكِّر',
  pair: 'ناقش',
  share: 'شارك',
};

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function ThinkPairShare({
  question,
  durations = { think: 60, pair: 90, share: 60 },
  modelAnswer,
}: ThinkPairShareProps) {
  const { isTeacher, revealLevel } = useTeacherMode();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(durations.think);

  const phase = PHASES[phaseIdx];

  useEffect(() => {
    setSecondsLeft(durations[phase]);
  }, [phase, durations]);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) {
      setRunning(false);
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [running, secondsLeft]);

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  const next = () => setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1));
  const prev = () => setPhaseIdx((i) => Math.max(i - 1, 0));
  const reset = () => {
    setPhaseIdx(0);
    setRunning(false);
    setSecondsLeft(durations.think);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-2xl leading-relaxed md:text-3xl">
        <MathText text={question} />
      </div>

      {/* Phase indicator */}
      <div className="flex items-center justify-center gap-2">
        {PHASES.map((p, i) => (
          <div
            key={p}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2 text-lg',
              i === phaseIdx
                ? 'border-[color:var(--sma-qamar-500)] bg-[color:var(--sma-qamar-500)]/20 text-[color:var(--sma-qamar-500)] font-bold'
                : i < phaseIdx
                  ? 'border-emerald-500/50 bg-emerald-900/20 text-emerald-200'
                  : 'border-white/15 bg-white/5 text-zinc-400',
            )}
          >
            <span
              className="inline-flex size-6 items-center justify-center rounded-full bg-black/30 text-sm font-mono"
              dir="ltr"
            >
              {i + 1}
            </span>
            <span>{PHASE_LABEL[p]}</span>
          </div>
        ))}
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="text-6xl font-mono tabular-nums text-white md:text-7xl"
          dir="ltr"
          aria-live="polite"
        >
          {pad2(mm)}:{pad2(ss)}
        </div>
        {isTeacher && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="rounded-lg bg-white/15 px-5 py-2 text-base text-white hover:bg-white/25"
            >
              {running ? 'إيقاف' : secondsLeft === 0 ? 'انتهى' : 'تشغيل'}
            </button>
            <button
              type="button"
              onClick={prev}
              disabled={phaseIdx === 0}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-zinc-200 hover:bg-white/20 disabled:opacity-40"
            >
              السابق
            </button>
            <button
              type="button"
              onClick={next}
              disabled={phaseIdx === PHASES.length - 1}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-zinc-200 hover:bg-white/20 disabled:opacity-40"
            >
              التالي
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-400 hover:bg-white/10"
            >
              ↺
            </button>
          </div>
        )}
      </div>

      {isTeacher && revealLevel >= 2 && modelAnswer && (
        <div className="rounded-xl bg-emerald-900/20 border border-emerald-700/50 p-5 text-lg">
          <span className="font-bold text-emerald-300 me-2">الإجابة النموذجية:</span>
          <MathText text={modelAnswer} />
        </div>
      )}
    </div>
  );
}
