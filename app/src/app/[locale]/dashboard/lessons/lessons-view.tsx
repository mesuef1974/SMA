'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toArabicIndic } from '@/lib/numerals';
import {
  MOCK_CHAPTERS,
  MOCK_LESSONS,
  MOCK_LESSON_PLANS,
  type LessonStatus,
} from '@/lib/mock-data';
import {
  BLOOM_KEYWORDS,
  BLOOM_LEVELS_ORDERED,
  type BloomLevel,
} from '@/lib/bloom-keywords';

const statusStyles: Record<LessonStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const bloomPillColors: Record<BloomLevel, string> = {
  remember: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  understand: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  apply: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  analyze: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  evaluate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  create: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

export function LessonsView() {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const [search, setSearch] = useState('');
  const [filterChapter, setFilterChapter] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<LessonStatus | null>(null);
  const [filterBloom, setFilterBloom] = useState<BloomLevel | null>(null);
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));

  // Build a map: lessonId -> best status from plans
  const lessonStatusMap = useMemo(() => {
    const map = new Map<string, LessonStatus>();
    for (const plan of MOCK_LESSON_PLANS) {
      const existing = map.get(plan.lessonId);
      // priority: approved > in_review > draft
      if (!existing || statusPriority(plan.status) > statusPriority(existing)) {
        map.set(plan.lessonId, plan.status);
      }
    }
    return map;
  }, []);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return MOCK_LESSONS.filter((lesson) => {
      if (filterChapter && lesson.chapterId !== filterChapter) return false;
      if (filterStatus) {
        const status = lessonStatusMap.get(lesson.id);
        if (status !== filterStatus) return false;
      }
      if (filterBloom && !lesson.bloomLevels.includes(filterBloom)) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchTitle =
          lesson.title_ar.includes(q) || lesson.title_en.toLowerCase().includes(q);
        if (!matchTitle) return false;
      }
      return true;
    });
  }, [search, filterChapter, filterStatus, filterBloom, lessonStatusMap]);

  // Group by chapter
  const groupedByChapter = useMemo(() => {
    const groups: Map<string, typeof filteredLessons> = new Map();
    for (const lesson of filteredLessons) {
      const existing = groups.get(lesson.chapterId) ?? [];
      existing.push(lesson);
      groups.set(lesson.chapterId, existing);
    }
    return groups;
  }, [filteredLessons]);

  function toggleChapter(chapterId: string) {
    setCollapsedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  }

  function clearFilters() {
    setSearch('');
    setFilterChapter(null);
    setFilterStatus(null);
    setFilterBloom(null);
  }

  const hasFilters = search || filterChapter || filterStatus || filterBloom;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('viewAllLessons')}</h2>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t('searchLessons')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
            aria-label={t('searchLessons')}
          />
        </div>

        {/* Chapter filter */}
        <select
          value={filterChapter ?? ''}
          onChange={(e) => setFilterChapter(e.target.value || null)}
          className="h-8 rounded-md border border-input bg-background px-3 text-sm"
          aria-label={t('filterByChapter')}
        >
          <option value="">{t('allChapters')}</option>
          {MOCK_CHAPTERS.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {locale === 'ar' ? ch.title_ar : ch.title_en}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus ?? ''}
          onChange={(e) => setFilterStatus((e.target.value as LessonStatus) || null)}
          className="h-8 rounded-md border border-input bg-background px-3 text-sm"
          aria-label={t('filterByStatus')}
        >
          <option value="">{t('allStatuses')}</option>
          <option value="draft">{t('draft')}</option>
          <option value="in_review">{t('inReview')}</option>
          <option value="approved">{t('approved')}</option>
        </select>

        {/* Bloom filter */}
        <select
          value={filterBloom ?? ''}
          onChange={(e) => setFilterBloom((e.target.value as BloomLevel) || null)}
          className="h-8 rounded-md border border-input bg-background px-3 text-sm"
          aria-label={t('filterByBloom')}
        >
          <option value="">{t('allBloomLevels')}</option>
          {BLOOM_LEVELS_ORDERED.map((level) => {
            const info = BLOOM_KEYWORDS[level];
            return (
              <option key={level} value={level}>
                {locale === 'ar' ? info.label_ar : info.label_en}
              </option>
            );
          })}
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            &times;
          </Button>
        )}
      </div>

      {/* Lesson list grouped by chapter */}
      {filteredLessons.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('noLessonsFound')}</p>
      ) : (
        <div className="space-y-4">
          {MOCK_CHAPTERS.filter((ch) => groupedByChapter.has(ch.id)).map((chapter) => {
            const lessons = groupedByChapter.get(chapter.id)!;
            const isCollapsed = collapsedChapters.has(chapter.id);
            const chapterTitle = locale === 'ar' ? chapter.title_ar : chapter.title_en;

            return (
              <Card key={chapter.id}>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleChapter(chapter.id)}
                  role="button"
                  aria-expanded={!isCollapsed}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleChapter(chapter.id);
                    }
                  }}
                >
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-base">
                      {t('chapter', { number: num(chapter.number) })}: {chapterTitle}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {num(lessons.length)}
                    </Badge>
                    <span className={cn('ms-auto transition-transform text-muted-foreground', isCollapsed && 'rotate-180 rtl:-rotate-180')}>
                      &#9650;
                    </span>
                  </CardTitle>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent>
                    <div className="divide-y divide-border">
                      {lessons.map((lesson) => {
                        const status = lessonStatusMap.get(lesson.id);
                        const statusLabel = status
                          ? status === 'draft'
                            ? t('draft')
                            : status === 'in_review'
                              ? t('inReview')
                              : t('approved')
                          : null;
                        const lessonTitle = locale === 'ar' ? lesson.title_ar : lesson.title_en;

                        return (
                          <div
                            key={lesson.id}
                            className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {t('lesson', { number: num(lesson.number) })}: {lessonTitle}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {t('periods')}: {num(lesson.periods)} &middot; {t('minutes', { count: num(lesson.periods * 45) })}
                              </p>
                            </div>

                            {/* Bloom pills */}
                            <div className="flex flex-wrap gap-1">
                              {lesson.bloomLevels.map((bl) => (
                                <Badge
                                  key={bl}
                                  className={cn('text-[10px] px-1.5', bloomPillColors[bl])}
                                >
                                  {locale === 'ar'
                                    ? BLOOM_KEYWORDS[bl].label_ar
                                    : BLOOM_KEYWORDS[bl].label_en}
                                </Badge>
                              ))}
                            </div>

                            {/* Status */}
                            {status && statusLabel && (
                              <Badge className={cn('shrink-0', statusStyles[status])}>
                                {statusLabel}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function statusPriority(s: LessonStatus): number {
  switch (s) {
    case 'approved': return 3;
    case 'in_review': return 2;
    case 'draft': return 1;
  }
}
