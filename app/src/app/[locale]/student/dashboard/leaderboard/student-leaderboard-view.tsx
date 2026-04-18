'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Star,
  Medal,
  Award,
  Footprints,
  Flame,
  Zap,
  Brain,
  Users,
  Timer,
  CalendarCheck,
  BookCheck,
  SearchCheck,
} from 'lucide-react';
import { toArabicIndic } from '@/lib/numerals';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BadgeEntry {
  id: string;
  code: string;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  category: string;
  earnedAt: string | null;
}

interface NearbyStudent {
  studentId: string;
  displayName: string;
  displayNameAr: string;
  xpTotal: number;
  level: number;
  levelNameAr: string;
  progressPercent: number;
  rank: number;
  isCurrentStudent: boolean;
}

interface StudentLeaderboardViewProps {
  studentName: string;
  myRank: number;
  totalStudents: number;
  xpTotal: number;
  level: number;
  levelNameAr: string;
  progressPercent: number;
  nextLevelXp: number | null;
  currentLevelXp: number;
  badges: BadgeEntry[];
  nearby: NearbyStudent[];
}

// ---------------------------------------------------------------------------
// Icon resolver for badges
// ---------------------------------------------------------------------------

const BADGE_ICONS: Record<string, typeof Trophy> = {
  footprints: Footprints,
  trophy: Trophy,
  flame: Flame,
  zap: Zap,
  brain: Brain,
  users: Users,
  timer: Timer,
  'calendar-check': CalendarCheck,
  'book-check': BookCheck,
  'search-check': SearchCheck,
};

function BadgeIcon({ icon, className }: { icon: string; className?: string }) {
  const IconComponent = BADGE_ICONS[icon] ?? Award;
  return <IconComponent className={className} />;
}

// ---------------------------------------------------------------------------
// Rank display with medals
// ---------------------------------------------------------------------------

function RankMedal({ rank, locale }: { rank: number; locale: string }) {
  const num = locale === 'ar' ? toArabicIndic(rank) : String(rank);

  if (rank === 1) {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
        <Trophy className="size-4 text-amber-500" aria-label={num} />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Medal className="size-4 text-gray-400" aria-label={num} />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
        <Medal className="size-4 text-orange-600" aria-label={num} />
      </div>
    );
  }

  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-muted">
      <span className="text-xs font-bold tabular-nums text-muted-foreground">{num}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudentLeaderboardView({
  studentName,
  myRank,
  totalStudents,
  xpTotal,
  level,
  levelNameAr,
  progressPercent,
  nextLevelXp,
  currentLevelXp,
  badges,
  nearby,
}: StudentLeaderboardViewProps) {
  const t = useTranslations('leaderboard');
  const locale = useLocale();

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <Trophy className="size-5 text-amber-500" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold">{t('title')}</h2>
      </div>

      {/* ---- Hero: Student rank + XP + Level ---- */}
      <Card className="border-[var(--sma-najm-700)] bg-gradient-to-l from-[var(--sma-najm-700)]/5 to-transparent dark:from-[var(--sma-najm-700)]/20">
        <CardContent className="py-5">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
            {/* Rank circle */}
            <div className="flex size-20 items-center justify-center rounded-full border-4 border-[var(--medal-gold)] bg-amber-50 dark:bg-amber-950/30">
              <span className="text-2xl font-black text-[var(--medal-gold)] tabular-nums">
                {num(myRank)}
              </span>
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <h3 className="text-lg font-bold truncate">{studentName}</h3>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <Badge className="bg-[var(--sma-najm-700)] text-white">
                  {levelNameAr} ({num(level)})
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {t('myRank')}: {num(myRank)} / {num(totalStudents)}
                </span>
              </div>

              {/* Level progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('progressToNext')}</span>
                  <span className="tabular-nums">
                    {nextLevelXp !== null
                      ? `${num(xpTotal - currentLevelXp)} / ${num(nextLevelXp - currentLevelXp)}`
                      : t('maxLevel')}
                  </span>
                </div>
                <div
                  className="h-2.5 w-full rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('progressToNext')}
                >
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* XP display */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <Star className="size-6 text-[var(--medal-gold)]" aria-hidden="true" />
              <span className="text-3xl font-black text-[var(--medal-gold)] tabular-nums">{num(xpTotal)}</span>
              <span className="text-xs text-muted-foreground">{t('xpUnit')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Stat cards row ---- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <Trophy className="size-5 text-[var(--medal-gold)]" aria-hidden="true" />
            <span className="text-2xl font-bold tabular-nums">{num(myRank)}</span>
            <span className="text-xs text-muted-foreground">{t('myRank')}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <Star className="size-5 text-success" aria-hidden="true" />
            <span className="text-2xl font-bold tabular-nums">{num(xpTotal)}</span>
            <span className="text-xs text-muted-foreground">{t('myXp')}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <Medal className="size-5 text-[var(--sma-najm-700)]" aria-hidden="true" />
            <span className="text-2xl font-bold tabular-nums">{num(level)}</span>
            <span className="text-xs text-muted-foreground">{t('myLevel')}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <Award className="size-5 text-purple-500" aria-hidden="true" />
            <span className="text-2xl font-bold tabular-nums">{num(badges.length)}</span>
            <span className="text-xs text-muted-foreground">{t('myBadges')}</span>
          </CardContent>
        </Card>
      </div>

      {/* ---- Badges showcase ---- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="size-5 text-purple-500" aria-hidden="true" />
            <CardTitle>{t('myBadges')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('noBadgesYet')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-3 text-center"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <BadgeIcon icon={badge.icon} className="size-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs font-medium leading-tight">{badge.nameAr}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{badge.descriptionAr}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Nearby students ranking ---- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-[var(--sma-najm-700)]" aria-hidden="true" />
            <CardTitle>{t('nearbyStudents')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nearby.map((entry) => {
              const displayedName =
                (locale === 'ar' ? entry.displayNameAr : entry.displayName) || entry.displayName;

              return (
                <div
                  key={entry.studentId}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                    entry.isCurrentStudent
                      ? 'border-[var(--sma-najm-700)] bg-[var(--sma-najm-700)]/5 dark:bg-[var(--sma-najm-700)]/20'
                      : 'border-transparent bg-muted/30',
                  )}
                >
                  <RankMedal rank={entry.rank} locale={locale} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm truncate', entry.isCurrentStudent && 'font-bold')}>
                        {displayedName}
                        {entry.isCurrentStudent && (
                          <span className="text-xs text-muted-foreground ms-1">({t('myRank')})</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className="bg-[var(--sma-najm-700)] text-white text-[10px]">
                        {entry.levelNameAr}
                      </Badge>
                      {/* Mini progress bar */}
                      <div className="h-1 flex-1 max-w-20 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-success"
                          style={{ width: `${entry.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-end shrink-0">
                    <div className="text-sm font-bold text-[var(--medal-gold)] tabular-nums">{num(entry.xpTotal)}</div>
                    <div className="text-[10px] text-muted-foreground">{t('xpUnit')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
