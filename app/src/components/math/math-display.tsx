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
import { sanitizeLatex, sanitizeLatexExpression } from '@/lib/latex/sanitize';

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
    // Defense in depth — sanitize artefacts even if the caller forgot to.
    const safe = sanitizeLatexExpression(latex);
    try {
      return katex.renderToString(safe, {
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
  // Run the full sanitizer first so `\(...\)`, `\[...\]`, and JSON-drift
  // artefacts (egin → \begin, ext → \text, …) all flow through the same
  // $/$$ code path downstream.
  const parts = useMemo(() => parseMathText(sanitizeLatex(text)), [text]);

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
 * Recognizes:
 *   $$...$$     → display math
 *   \[ ... \]   → display math  (ChatGPT / Qwen style)
 *   $...$       → inline math
 *   \( ... \)   → inline math   (ChatGPT / Qwen style)
 *
 * The `sanitizeLatex` pass in `MathText` already normalizes `\(..\)` /
 * `\[..\]` into `$..$` / `$$..$$`, but we also match them natively here
 * as a belt-and-braces guard against callers that bypass the sanitizer.
 */
function parseMathText(input: string): Part[] {
  const parts: Part[] = [];
  // Order matters — $$ and \[..\] must match before $ and \(..\).
  const regex =
    /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$]+?)\$|\\\(([\s\S]+?)\\\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: input.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      parts.push({ type: 'display', value: match[1].trim() });
    } else if (match[2] !== undefined) {
      parts.push({ type: 'display', value: match[2].trim() });
    } else if (match[3] !== undefined) {
      parts.push({ type: 'inline', value: match[3].trim() });
    } else if (match[4] !== undefined) {
      parts.push({ type: 'inline', value: match[4].trim() });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < input.length) {
    parts.push({ type: 'text', value: input.slice(lastIndex) });
  }

  return parts;
}
