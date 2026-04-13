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

const TOAST_CONFIG: Record<
  Toast['type'],
  { icon: string; className: string }
> = {
  xp: {
    icon: '\u2B50', // star
    className:
      'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950',
  },
  badge: {
    icon: '\uD83C\uDFC5', // medal
    className:
      'bg-gradient-to-r from-purple-500 to-violet-600 text-white',
  },
  levelUp: {
    icon: '\u2B06\uFE0F', // up arrow
    className:
      'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
  },
  correct: {
    icon: '\u2705', // check mark
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200',
  },
  streak: {
    icon: '\uD83D\uDD25', // fire
    className:
      'bg-gradient-to-r from-orange-400 to-orange-600 text-white',
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
        'flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg',
        'cursor-pointer select-none min-w-[260px] max-w-[360px]',
        'transition-all',
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
      className="fixed bottom-4 left-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
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
