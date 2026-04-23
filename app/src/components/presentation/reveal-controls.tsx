'use client';

/**
 * RevealControls — three-button disclosure bar for the teacher.
 *
 * Visible only when teacher mode is active. Controls the global revealLevel:
 *   L0 (question only) → L1 (hint) → L2 (full solution).
 *
 * The "reset" button (↺) jumps back to L0.
 */

import { Eye, Lightbulb, RotateCcw } from 'lucide-react';
import { useTeacherMode } from './teacher-mode-context';
import { cn } from '@/lib/utils';

export function RevealControls() {
  const { isTeacher, revealLevel, setRevealLevel } = useTeacherMode();
  if (!isTeacher) return null;

  const btnBase =
    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors';
  const btnIdle = 'bg-white/10 text-zinc-200 hover:bg-white/20';
  const btnActive =
    'bg-[color:var(--sma-qamar-500)]/25 text-[color:var(--sma-qamar-500)] border border-[color:var(--sma-qamar-500)]/60';

  return (
    <div
      role="group"
      aria-label="مستوى كشف الإجابة"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => setRevealLevel(1)}
        className={cn(btnBase, revealLevel === 1 ? btnActive : btnIdle)}
        aria-pressed={revealLevel === 1}
      >
        <Lightbulb className="size-4" aria-hidden />
        <span>تلميح</span>
      </button>
      <button
        type="button"
        onClick={() => setRevealLevel(2)}
        className={cn(btnBase, revealLevel === 2 ? btnActive : btnIdle)}
        aria-pressed={revealLevel === 2}
      >
        <Eye className="size-4" aria-hidden />
        <span>إظهار الحل</span>
      </button>
      <button
        type="button"
        onClick={() => setRevealLevel(0)}
        className={cn(btnBase, revealLevel === 0 ? btnActive : btnIdle)}
        aria-pressed={revealLevel === 0}
      >
        <RotateCcw className="size-4" aria-hidden />
        <span>إخفاء</span>
      </button>
      <span className="ms-2 text-xs text-zinc-500" aria-live="polite">
        المستوى: L{revealLevel}
      </span>
    </div>
  );
}
