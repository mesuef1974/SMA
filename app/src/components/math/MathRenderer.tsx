'use client';

import 'katex/dist/katex.min.css';
import TeX from '@matejmazur/react-katex';

interface MathRendererProps {
  math: string;
  display?: boolean;
}

export function MathRenderer({ math, display = false }: MathRendererProps) {
  return <TeX math={math} block={display} errorColor="#cc0000" />;
}
