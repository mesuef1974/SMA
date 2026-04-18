'use client';

/**
 * MathDisplay — renders LaTeX math expressions using KaTeX.
 *
 * Uses katex.renderToString() + dangerouslySetInnerHTML.
 * This is safe because KaTeX sanitizes input — it does not execute
 * arbitrary JavaScript or HTML; it only produces math-rendering markup.
 *
 * Supports:
 *   - inline mode (default): renders inline with surrounding text
 *   - display mode: renders as a centered block equation
 *   - automatic detection: strings wrapped in $$...$$ render as display,
 *     strings wrapped in $...$ render as inline
 */

import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface MathDisplayProps {
  /** The LaTeX expression to render (without surrounding $ delimiters). */
  latex: string;
  /** If true, renders in display mode (centered block). Defaults to false. */
  display?: boolean;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Renders a single LaTeX expression using KaTeX.
 */
export function MathDisplay({ latex, display = false, className }: MathDisplayProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        // BRAND-APPROVED: KaTeX errorColor API requires a literal CSS color string — brand-book §Typography
        errorColor: 'var(--destructive)',
        trust: false,
        strict: false,
      });
    } catch {
      return `<span style="color:var(--destructive)">خطأ في عرض المعادلة</span>`;
    }
  }, [latex, display]);

  if (display) {
    return (
      <div
        className={cn('my-2 overflow-x-auto text-center', className)}
        dir="ltr"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={cn('inline-block align-middle', className)}
      dir="ltr"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Renders a string that may contain inline ($...$) and display ($$...$$)
 * LaTeX expressions mixed with regular text.
 *
 * Usage:
 *   <MathText text="المساحة هي $A = \pi r^2$ وأيضاً $$x = \frac{-b}{2a}$$" />
 */
export function MathText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = useMemo(() => parseMathText(text), [text]);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.value}</span>;
        }
        return (
          <MathDisplay
            key={i}
            latex={part.value}
            display={part.type === 'display'}
          />
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Internal parser
// ---------------------------------------------------------------------------

interface TextPart {
  type: 'text';
  value: string;
}

interface MathPart {
  type: 'inline' | 'display';
  value: string;
}

type Part = TextPart | MathPart;

/**
 * Splits a string into alternating text and LaTeX segments.
 * Recognizes $$...$$ (display) and $...$ (inline).
 */
function parseMathText(input: string): Part[] {
  const parts: Part[] = [];
  // Match $$...$$ first (greedy but non-capturing for inner $), then $...$
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    // Push any text before this match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: input.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // $$...$$ — display math
      parts.push({ type: 'display', value: match[1].trim() });
    } else if (match[2] !== undefined) {
      // $...$ — inline math
      parts.push({ type: 'inline', value: match[2].trim() });
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < input.length) {
    parts.push({ type: 'text', value: input.slice(lastIndex) });
  }

  return parts;
}
