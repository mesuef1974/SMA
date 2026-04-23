'use client';

/**
 * TeacherModeContext — Session-scoped teacher privilege for the presentation view.
 *
 * Default state: STUDENT (answers hidden).
 *
 * Teacher activates via 4-digit PIN. PIN is stored as SHA-256 hash in
 * localStorage (`sma.teacherPinHash`). On first use (no hash found), the first
 * PIN entered becomes the teacher PIN. Session lasts 2 hours — expiry tracked
 * in `sma.teacherExpiry` (epoch ms).
 *
 * Reveal level is teacher-only and resets to L0 whenever teacher mode is
 * disabled or expires.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type RevealLevel = 0 | 1 | 2;

interface TeacherModeContextValue {
  isTeacher: boolean;
  hasPinSet: boolean;
  /** Returns true on success, false on wrong PIN. Sets PIN on first use. */
  enableTeacherMode: (pin: string) => Promise<boolean>;
  disableTeacherMode: () => void;
  resetPin: () => void;
  revealLevel: RevealLevel;
  setRevealLevel: (level: RevealLevel) => void;
}

const TeacherModeContext = createContext<TeacherModeContextValue | null>(null);

const PIN_HASH_KEY = 'sma.teacherPinHash';
const EXPIRY_KEY = 'sma.teacherExpiry';
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readPinHash(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(PIN_HASH_KEY);
}

function readExpiry(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(EXPIRY_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function TeacherModeProvider({ children }: { children: ReactNode }) {
  // Lazy initialization reads localStorage once on first render (client).
  // This avoids React 19's "setState in effect" rule.
  const [isTeacher, setIsTeacher] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return readExpiry() > Date.now();
  });
  const [hasPinSet, setHasPinSet] = useState<boolean>(() => Boolean(readPinHash()));
  const [revealLevel, setRevealLevelState] = useState<RevealLevel>(0);

  // Auto-expire watcher: drops teacher back to student when session TTL elapses.
  useEffect(() => {
    if (!isTeacher) return;
    const expiry = readExpiry();
    const ms = expiry - Date.now();
    if (ms <= 0) {
      // Edge case: mount raced with expiry — schedule microtask cleanup.
      const t = window.setTimeout(() => {
        setIsTeacher(false);
        setRevealLevelState(0);
        window.localStorage.removeItem(EXPIRY_KEY);
      }, 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      setIsTeacher(false);
      setRevealLevelState(0);
      window.localStorage.removeItem(EXPIRY_KEY);
    }, ms);
    return () => window.clearTimeout(t);
  }, [isTeacher]);

  const enableTeacherMode = useCallback(async (pin: string): Promise<boolean> => {
    if (!/^\d{4}$/.test(pin)) return false;
    const incoming = await hashPin(pin);
    const stored = readPinHash();

    if (!stored) {
      // First-use: this PIN becomes the teacher PIN
      window.localStorage.setItem(PIN_HASH_KEY, incoming);
      setHasPinSet(true);
    } else if (stored !== incoming) {
      return false;
    }

    const expiry = Date.now() + SESSION_DURATION_MS;
    window.localStorage.setItem(EXPIRY_KEY, String(expiry));
    setIsTeacher(true);
    return true;
  }, []);

  const disableTeacherMode = useCallback(() => {
    setIsTeacher(false);
    setRevealLevelState(0);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(EXPIRY_KEY);
    }
  }, []);

  const resetPin = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(PIN_HASH_KEY);
    window.localStorage.removeItem(EXPIRY_KEY);
    setHasPinSet(false);
    setIsTeacher(false);
    setRevealLevelState(0);
  }, []);

  const setRevealLevel = useCallback((level: RevealLevel) => {
    setRevealLevelState(level);
  }, []);

  const value = useMemo<TeacherModeContextValue>(
    () => ({
      isTeacher,
      hasPinSet,
      enableTeacherMode,
      disableTeacherMode,
      resetPin,
      revealLevel,
      setRevealLevel,
    }),
    [
      isTeacher,
      hasPinSet,
      enableTeacherMode,
      disableTeacherMode,
      resetPin,
      revealLevel,
      setRevealLevel,
    ],
  );

  return (
    <TeacherModeContext.Provider value={value}>{children}</TeacherModeContext.Provider>
  );
}

export function useTeacherMode(): TeacherModeContextValue {
  const ctx = useContext(TeacherModeContext);
  if (!ctx) {
    throw new Error('useTeacherMode must be used inside <TeacherModeProvider>');
  }
  return ctx;
}
