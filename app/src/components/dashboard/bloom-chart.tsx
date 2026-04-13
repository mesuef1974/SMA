'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BLOOM_KEYWORDS, BLOOM_LEVELS_ORDERED, type BloomLevel } from '@/lib/bloom-keywords';
import { toArabicIndic } from '@/lib/numerals';
import { cn } from '@/lib/utils';

/** Tailwind bar colour per Bloom level (ordered low-to-high) */
const BLOOM_COLORS: Record<BloomLevel, string> = {
  remember: 'bg-sky-500',
  understand: 'bg-teal-500',
  apply: 'bg-emerald-500',
  analyze: 'bg-amber-500',
  evaluate: 'bg-orange-500',
  create: 'bg-rose-500',
};

interface BloomChartProps {
  distribution: Record<BloomLevel, number>;
  className?: string;
}

export function BloomChart({ distribution, className }: BloomChartProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const max = Math.max(...Object.values(distribution), 1);

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{t('bloomDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {BLOOM_LEVELS_ORDERED.map((level) => {
            const info = BLOOM_KEYWORDS[level];
            const count = distribution[level];
            const pct = Math.round((count / max) * 100);
            const label = locale === 'ar' ? info.label_ar : info.label_en;

            return (
              <div key={level} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-medium tabular-nums">{num(count)}</span>
                </div>
                <div
                  className="h-2 w-full rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-label={label}
                >
                  <div
                    className={cn('h-full rounded-full transition-all', BLOOM_COLORS[level])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
