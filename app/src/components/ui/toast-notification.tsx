'use client';

/**
 * ToastNotification — lightweight notification component for gamification events.
 *
 * Supports types: xp, badge, levelUp, correct, streak.
 * Uses pure CSS animations (no framer-motion).
 * Positioned bottom-left (correct for RTL layouts).
 */

import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Toast {
  id: string;
  type: 'xp' | 'badge' | 'levelUp' | 'correct' | 'streak';
  title: string;
  message?: string;
  icon?: string;
  duration?: number; // ms, default 3000
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Config per toast type
// ---------------------------------------------------------------------------

// Brand-book §Components > Toast: ink-950 bg + accent stripe per type
const TOAST_CONFIG: Record<
  Toast['type'],
  { icon: string; className: string }
> = {
  xp: {
    icon: '\u2B50', // star
    className:
      'bg-[var(--sma-ink-950)] text-[var(--sma-qamar-500)] border-s-4 border-[var(--sma-qamar-500)]',
  },
  badge: {
    icon: '\uD83C\uDFC5', // medal
    className:
      'bg-[var(--sma-ink-950)] text-[var(--sma-sahla-400)] border-s-4 border-[var(--sma-sahla-500)]',
  },
  levelUp: {
    icon: '\u2B06\uFE0F', // up arrow
    className:
      'bg-[var(--sma-ink-950)] text-success border-s-4 border-success',
  },
  correct: {
    icon: '\u2705', // check mark
    className:
      'bg-[var(--sma-ink-950)] text-success border-s-4 border-success',
  },
  streak: {
    icon: '\uD83D\uDD25', // fire
    className:
      'bg-[var(--sma-ink-950)] text-warning border-s-4 border-warning',
  },
};

// ---------------------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------------------

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);
  const duration = toast.duration ?? 3000;
  const config = TOAST_CONFIG[toast.type];
  const icon = toast.icon ?? config.icon;

  const startExit = useCallback(() => {
    setExiting(true);
    // Wait for the slide-out animation to finish before removing
    setTimeout(() => onDismiss(toast.id), 300);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    const timer = setTimeout(startExit, duration);
    return () => clearTimeout(timer);
  }, [duration, startExit]);

  return (
    <button
      type="button"
      onClick={startExit}
      className={[
        'flex items-center gap-3 rounded-[var(--r-md)] px-5 py-3 shadow-lg',
        'cursor-pointer select-none min-w-[260px] max-w-[360px]',
        'transition-all duration-[var(--duration-normal)] ease-[var(--ease-standard)]',
        config.className,
        exiting ? 'toast-slide-out' : 'toast-slide-in',
      ].join(' ')}
      aria-live="polite"
      role="status"
    >
      <span className="text-2xl shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="flex flex-col items-start text-start">
        <span className="text-sm font-bold leading-tight">{toast.title}</span>
        {toast.message && (
          <span className="text-xs opacity-80 leading-tight mt-0.5">
            {toast.message}
          </span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Toast container
// ---------------------------------------------------------------------------

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  // Show at most 3 toasts
  const visible = toasts.slice(-3);

  if (visible.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 inset-x-0 mx-auto z-[9999] flex w-fit flex-col-reverse items-center gap-2 pointer-events-none"
      aria-label="الإشعارات"
    >
      {visible.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
