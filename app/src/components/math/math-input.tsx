'use client';

/**
 * MathInput — interactive math input component using MathLive's <math-field>.
 *
 * Wraps the mathlive web component for React usage.
 * Dynamic import avoids SSR issues (mathlive requires DOM).
 * Outputs LaTeX string on change.
 *
 * Uses imperative DOM creation to avoid JSX type issues with custom elements
 * in React 19 / Next.js 16 strict mode.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MathInputProps {
  /** Current LaTeX value. */
  value?: string;
  /** Callback fired with the new LaTeX string on every edit. */
  onChange?: (latex: string) => void;
  /** Placeholder text shown when the field is empty. */
  placeholder?: string;
  /** Prevents user interaction. */
  disabled?: boolean;
  /** Displays the field as read-only (shows content but no editing). */
  readOnly?: boolean;
  /** Additional CSS classes for the wrapper. */
  className?: string;
}

/**
 * MathField web component element type.
 */
interface MathFieldElement extends HTMLElement {
  value: string;
  readOnly: boolean;
  disabled: boolean;
}

export function MathInput({
  value = '',
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  className,
}: MathInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<MathFieldElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Dynamic import of mathlive to avoid SSR issues
  useEffect(() => {
    let cancelled = false;
    import('mathlive').then(() => {
      if (!cancelled) setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Create the math-field element imperatively once mathlive is loaded
  const setupField = useCallback(
    (container: HTMLDivElement | null) => {
      containerRef.current = container;
      if (!container || !loaded) return;

      // Avoid creating duplicate elements
      if (mfRef.current && container.contains(mfRef.current)) return;

      const mf = document.createElement('math-field') as MathFieldElement;
      mf.value = value;
      if (placeholder) mf.setAttribute('placeholder', placeholder);
      if (readOnly) mf.setAttribute('read-only', '');
      if (disabled) mf.setAttribute('disabled', '');
      mf.setAttribute('dir', 'ltr');
      mf.style.direction = 'ltr';
      mf.style.display = 'block';
      mf.style.width = '100%';

      mf.addEventListener('input', () => {
        onChangeRef.current?.(mf.value);
      });

      container.innerHTML = '';
      container.appendChild(mf);
      mfRef.current = mf;
    },
    [loaded, value, placeholder, readOnly, disabled],
  );

  // Sync external value changes into the field
  useEffect(() => {
    const mf = mfRef.current;
    if (mf && loaded && mf.value !== value) {
      mf.value = value;
    }
  }, [value, loaded]);

  // Sync readOnly / disabled attributes
  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;
    if (readOnly) {
      mf.setAttribute('read-only', '');
    } else {
      mf.removeAttribute('read-only');
    }
    if (disabled) {
      mf.setAttribute('disabled', '');
    } else {
      mf.removeAttribute('disabled');
    }
  }, [readOnly, disabled]);

  if (!loaded) {
    return (
      <div
        className={cn(
          'flex h-12 items-center justify-center rounded-lg border border-input bg-background text-sm text-muted-foreground',
          className,
        )}
      >
        {placeholder ?? '...'}
      </div>
    );
  }

  return (
    <div
      ref={setupField}
      className={cn(
        '[&>math-field]:block [&>math-field]:w-full [&>math-field]:rounded-lg [&>math-field]:border [&>math-field]:border-input [&>math-field]:bg-background [&>math-field]:px-3 [&>math-field]:py-2 [&>math-field]:text-lg',
        '[&>math-field:focus-within]:border-ring [&>math-field:focus-within]:ring-2 [&>math-field:focus-within]:ring-ring/50',
        '[&>math-field[disabled]]:cursor-not-allowed [&>math-field[disabled]]:opacity-50',
        className,
      )}
    />
  );
}
