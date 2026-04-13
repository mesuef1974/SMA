'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toArabicIndic } from '@/lib/numerals';
import type { MisconceptionSeverity } from '@/lib/mock-data';

interface MisconceptionItem {
  id: string;
  name_ar: string;
  name_en: string;
  frequency: number;
  severity: MisconceptionSeverity;
}

interface MisconceptionAlertProps {
  items: MisconceptionItem[];
  className?: string;
}

const severityStyles: Record<MisconceptionSeverity, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export function MisconceptionAlert({ items, className }: MisconceptionAlertProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-500" aria-hidden="true" />
          <CardTitle>{t('recentMisconceptions')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const name = locale === 'ar' ? item.name_ar : item.name_en;
            const severityLabel =
              item.severity === 'high'
                ? t('high')
                : item.severity === 'medium'
                  ? t('medium')
                  : t('low');

            return (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('frequency')}: {num(item.frequency)}
                  </p>
                </div>
                <Badge className={cn('shrink-0', severityStyles[item.severity])}>
                  {severityLabel}
                </Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
