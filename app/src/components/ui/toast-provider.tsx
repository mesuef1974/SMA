'use client';

/**
 * ToastProvider — context provider for the toast notification system.
 *
 * Provides convenience methods for gamification toasts:
 *   showToast, showXPToast, showBadgeToast, showLevelUpToast,
 *   showCorrectToast, showStreakToast.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { Toast, ToastContainer } from './toast-notification';

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showXPToast: (amount: number) => void;
  showBadgeToast: (badgeName: string) => void;
  showLevelUpToast: (level: number, levelName: string) => void;
  showCorrectToast: () => void;
  showStreakToast: (count: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => {
      // Keep at most 3 — remove oldest if needed
      const next = [...prev, newToast];
      return next.length > 3 ? next.slice(-3) : next;
    });
  }, []);

  const showXPToast = useCallback(
    (amount: number) => {
      showToast({
        type: 'xp',
        title: `+${amount} XP`,
      });
    },
    [showToast],
  );

  const showBadgeToast = useCallback(
    (badgeName: string) => {
      showToast({
        type: 'badge',
        title: '\u0634\u0627\u0631\u0629 \u062C\u062F\u064A\u062F\u0629!', // "شارة جديدة!"
        message: badgeName,
      });
    },
    [showToast],
  );

  const showLevelUpToast = useCallback(
    (level: number, levelName: string) => {
      showToast({
        type: 'levelUp',
        title: '\u062A\u0631\u0642\u064A\u0629!', // "ترقية!"
        message: `\u0627\u0644\u0645\u0633\u062A\u0648\u0649 ${level} \u2014 ${levelName}`, // "المستوى {level} — {levelName}"
      });
    },
    [showToast],
  );

  const showCorrectToast = useCallback(() => {
    showToast({
      type: 'correct',
      title: '\u0625\u062C\u0627\u0628\u0629 \u0635\u062D\u064A\u062D\u0629!', // "إجابة صحيحة!"
      duration: 2000,
    });
  }, [showToast]);

  const showStreakToast = useCallback(
    (count: number) => {
      showToast({
        type: 'streak',
        title: `\u0633\u0644\u0633\u0644\u0629 ${count}! \uD83D\uDD25`, // "سلسلة {count}! 🔥"
      });
    },
    [showToast],
  );

  const value: ToastContextValue = {
    showToast,
    showXPToast,
    showBadgeToast,
    showLevelUpToast,
    showCorrectToast,
    showStreakToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
