'use client';

import 'katex/dist/katex.min.css';
import TeX from '@matejmazur/react-katex';

interface MathRendererProps {
  math: string;
  display?: boolean;
}

export function MathRenderer({ math, display = false }: MathRendererProps) {
  // BRAND-APPROVED: react-katex errorColor prop requires a literal CSS color string — brand-book §Typography
  return <TeX math={math} block={display} errorColor="var(--destructive)" />;
}
