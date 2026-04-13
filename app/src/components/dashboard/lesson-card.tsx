'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BookOpen, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toArabicIndic } from '@/lib/numerals';

type LessonStatus = 'draft' | 'in_review' | 'approved';

interface LessonCardProps {
  lessonNumber: number;
  titleAr: string;
  titleEn: string;
  chapterNumber: number;
  periodSlot?: number;
  periods: number;
  status: LessonStatus;
  className?: string;
}

const statusStyles: Record<LessonStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export function LessonCard({
  lessonNumber,
  titleAr,
  titleEn,
  chapterNumber,
  periodSlot,
  periods,
  status,
  className,
}: LessonCardProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));
  const title = locale === 'ar' ? titleAr : titleEn;

  const statusLabel =
    status === 'draft'
      ? t('draft')
      : status === 'in_review'
        ? t('inReview')
        : t('approved');

  return (
    <Card className={cn('hover:ring-2 hover:ring-primary/20 transition-shadow', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{title}</CardTitle>
          <Badge className={cn('shrink-0', statusStyles[status])}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3.5" aria-hidden="true" />
            {t('chapter', { number: num(chapterNumber) })} &mdash; {t('lesson', { number: num(lessonNumber) })}
          </span>
          {periodSlot != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {t('period', { number: num(periodSlot) })}
            </span>
          )}
          <span className="text-xs">
            {t('minutes', { count: num(periods * 45) })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
