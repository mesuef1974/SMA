'use client';

import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toArabicIndic } from '@/lib/numerals';
import { useLocale } from 'next-intl';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  /** Optional secondary info displayed as a small badge / note */
  detail?: string;
  /** Tailwind colour class applied to the icon background */
  iconClassName?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  iconClassName,
  className,
}: StatCardProps) {
  const locale = useLocale();
  const displayValue = locale === 'ar' ? toArabicIndic(value) : String(value);

  return (
    <Card className={cn('flex-1 min-w-[160px]', className)}>
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            iconClassName ?? 'bg-primary/10 text-primary',
          )}
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold leading-tight">{displayValue}</p>
          {detail && (
            <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
