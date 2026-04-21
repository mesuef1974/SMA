'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Search, Sparkles, BookOpen, ChevronUp } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toArabicIndic } from '@/lib/numerals';

// ---------------------------------------------------------------------------
// Types — serializable data passed from the server component
// ---------------------------------------------------------------------------

type LessonStatus = 'draft' | 'in_review' | 'approved';

interface LessonData {
  id: string;
  chapterId: string;
  number: number;
  titleAr: string;
  titleEn: string;
  periods: number;
  status: LessonStatus | null;
}

interface ChapterData {
  id: string;
  number: number;
  titleAr: string;
  titleEn: string;
  lessons: LessonData[];
}

interface LessonsViewProps {
  chapters: ChapterData[];
}

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------

const statusStyles: Record<LessonStatus, string> = {
  draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LessonsView({ chapters }: LessonsViewProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();

  const [search, setSearch] = useState('');
  const [filterChapter, setFilterChapter] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<LessonStatus | null>(null);
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));

  // Flatten all lessons with chapter reference for filtering
  const allLessons = useMemo(() => {
    return chapters.flatMap((ch) => ch.lessons);
  }, [chapters]);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return allLessons.filter((lesson) => {
      if (filterChapter && lesson.chapterId !== filterChapter) return false;
      if (filterStatus) {
        if (lesson.status !== filterStatus) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const matchTitle =
          lesson.titleAr.includes(q) || lesson.titleEn.toLowerCase().includes(q);
        if (!matchTitle) return false;
      }
      return true;
    });
  }, [search, filterChapter, filterStatus, allLessons]);

  // Group filtered lessons by chapter
  const groupedByChapter = useMemo(() => {
    const groups: Map<string, LessonData[]> = new Map();
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
  }

  const hasFilters = search || filterChapter || filterStatus;

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="الدروس" subtitle="منهج الرياضيات — الصف الحادي عشر" icon={BookOpen} />

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
          {chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {locale === 'ar' ? ch.titleAr : ch.titleEn}
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
          {chapters.filter((ch) => groupedByChapter.has(ch.id)).map((chapter) => {
            const chapterLessons = groupedByChapter.get(chapter.id)!;
            const isCollapsed = collapsedChapters.has(chapter.id);
            const chapterTitle = locale === 'ar' ? chapter.titleAr : chapter.titleEn;

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
                      {num(chapterLessons.length)}
                    </Badge>
                    <span className={cn('ms-auto transition-transform text-muted-foreground', isCollapsed && 'rotate-180 rtl:-rotate-180')}>
                      <ChevronUp className="size-4" />
                    </span>
                  </CardTitle>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent>
                    <div className="divide-y divide-border">
                      {chapterLessons.map((lesson) => {
                        const statusLabel = lesson.status
                          ? lesson.status === 'draft'
                            ? t('draft')
                            : lesson.status === 'in_review'
                              ? t('inReview')
                              : t('approved')
                          : null;
                        const lessonTitle = locale === 'ar' ? lesson.titleAr : lesson.titleEn;

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

                            {/* Status */}
                            {lesson.status && statusLabel && (
                              <Badge className={cn('shrink-0', statusStyles[lesson.status])}>
                                {statusLabel}
                              </Badge>
                            )}

                            {/* Prepare link */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 shrink-0"
                              render={<Link href={`/dashboard/lessons/${lesson.id}/prepare`} />}
                            >
                              <Sparkles className="size-3.5" />
                              {t('prepareLessonPlan')}
                            </Button>
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
