'use client';

/**
 * TeacherModeToggle — header button + PIN dialog.
 *
 * When teacher mode is off: clicking opens a dialog requesting a 4-digit PIN.
 * First-use flow: the first PIN entered becomes the teacher PIN (also shown in
 * helper text).
 *
 * When teacher mode is on: clicking disables it immediately.
 */

import { Eye, EyeOff, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTeacherMode } from './teacher-mode-context';

export function TeacherModeToggle() {
  const { isTeacher, hasPinSet, enableTeacherMode, disableTeacherMode } = useTeacherMode();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = useCallback(() => {
    if (isTeacher) {
      disableTeacherMode();
      return;
    }
    setPin('');
    setError(null);
    setOpen(true);
  }, [isTeacher, disableTeacherMode]);

  useEffect(() => {
    if (open) {
      // Focus the input when dialog opens
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!/^\d{4}$/.test(pin)) {
        setError('الرجاء إدخال 4 أرقام');
        return;
      }
      setBusy(true);
      const ok = await enableTeacherMode(pin);
      setBusy(false);
      if (ok) {
        setOpen(false);
        setPin('');
        setError(null);
      } else {
        setError('رمز PIN غير صحيح');
      }
    },
    [pin, enableTeacherMode],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setPin('');
    setError(null);
  }, []);

  // ESC to close dialog (but not exit presentation)
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, handleClose]);

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className={
          isTeacher
            ? 'flex items-center gap-2 rounded-lg bg-[color:var(--sma-qamar-500)]/20 border border-[color:var(--sma-qamar-500)]/60 px-4 py-2 text-sm text-[color:var(--sma-qamar-500)] transition-colors hover:bg-[color:var(--sma-qamar-500)]/30'
            : 'flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/20 hover:text-white'
        }
        aria-pressed={isTeacher}
        aria-label={isTeacher ? 'إيقاف وضع المعلم' : 'تفعيل وضع المعلم'}
      >
        {isTeacher ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        <span>{isTeacher ? 'وضع المعلم فعّال' : 'وضع المعلم'}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="teacher-pin-title"
          dir="rtl"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 id="teacher-pin-title" className="text-xl font-bold text-white">
                تفعيل وضع المعلم
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                aria-label="إغلاق"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-4">
              {hasPinSet
                ? 'أدخل رمز PIN المكوّن من 4 أرقام.'
                : 'الاستخدام الأول: اختر رمز PIN مكوّن من 4 أرقام. سيُستعمل نفس الرمز لاحقاً.'}
            </p>

            <label className="block text-xs text-zinc-400 mb-1" htmlFor="teacher-pin-input">
              رمز PIN
            </label>
            <input
              id="teacher-pin-input"
              ref={inputRef}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(v);
                if (error) setError(null);
              }}
              dir="ltr"
              className="w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white focus:border-[color:var(--sma-qamar-500)] focus:outline-none"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'teacher-pin-error' : undefined}
            />

            {error && (
              <p id="teacher-pin-error" className="mt-2 text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-white/10"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={busy || pin.length !== 4}
                className="rounded-lg bg-[color:var(--sma-qamar-500)] px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? '…' : 'تفعيل'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
