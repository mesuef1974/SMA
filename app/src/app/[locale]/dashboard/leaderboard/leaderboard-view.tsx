'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Trophy,
  Users,
  Eye,
  EyeOff,
  Medal,
  Star,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { toArabicIndic } from '@/lib/numerals';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types -- serializable data passed from the server component
// ---------------------------------------------------------------------------

interface StudentEntry {
  studentId: string;
  displayName: string;
  displayNameAr: string;
  xpTotal: number;
  level: number;
  levelNameAr: string;
  badgesCount: number;
  progressPercent: number;
}

interface TeamEntry {
  teamId: string;
  nameAr: string;
  color: string | null;
  challengeTitleAr: string;
  totalXp: number;
  memberCount: number;
}

interface ClassroomData {
  id: string;
  name: string;
  nameAr: string;
  students: StudentEntry[];
  teams: TeamEntry[];
}

interface LeaderboardViewProps {
  classrooms: ClassroomData[];
}

// ---------------------------------------------------------------------------
// Medal icons for top 3
// ---------------------------------------------------------------------------

function RankDisplay({ rank, locale }: { rank: number; locale: string }) {
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

export function LeaderboardView({ classrooms }: LeaderboardViewProps) {
  const t = useTranslations('leaderboard');
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState<string>(classrooms[0]?.id ?? '');
  const [hideNames, setHideNames] = useState(false);

  const selected = classrooms.find((c) => c.id === selectedId);

  const num = (n: number) => (locale === 'ar' ? toArabicIndic(n) : String(n));

  // Empty state
  if (classrooms.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="لوحة الشرف" subtitle="ترتيب الطلاب" icon={Trophy} />
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <GraduationCap className="size-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t('noClassrooms')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="لوحة الشرف"
        subtitle="ترتيب الطلاب"
        icon={Trophy}
        action={
          classrooms.length > 1 ? (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={t('selectClassroom')}
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'ar' ? c.nameAr : c.name}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />

      {/* Privacy notice */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
        <Shield className="size-4 shrink-0" aria-hidden="true" />
        <span>{t('privacyNotice')}</span>
      </div>

      {selected && (
        <Tabs defaultValue="individuals">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="individuals">
                <Star className="size-4" aria-hidden="true" />
                {t('individualsTab')}
              </TabsTrigger>
              <TabsTrigger value="teams">
                <Users className="size-4" aria-hidden="true" />
                {t('teamsTab')}
              </TabsTrigger>
            </TabsList>

            {/* Hide names toggle — only relevant in individuals tab */}
            <button
              type="button"
              onClick={() => setHideNames(!hideNames)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
                hideNames
                  ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
                  : 'border-input bg-background text-muted-foreground hover:bg-muted',
              )}
              aria-pressed={hideNames}
            >
              {hideNames ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
              {hideNames ? t('showNames') : t('hideNames')}
            </button>
          </div>

          {/* ---- Individuals Tab ---- */}
          <TabsContent value="individuals">
            {selected.students.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">{t('noStudents')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {selected.students.map((student, idx) => {
                  const rank = idx + 1;
                  const displayedName = hideNames
                    ? t('anonymousStudent', { number: num(rank) })
                    : (locale === 'ar' ? student.displayNameAr : student.displayName) || student.displayName;

                  return (
                    <Card
                      key={student.studentId}
                      className={cn(
                        'transition-shadow hover:shadow-md',
                        rank === 1 && 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20',
                        rank === 2 && 'border-gray-300 bg-gray-50/50 dark:border-gray-600 dark:bg-gray-900/20',
                        rank === 3 && 'border-orange-300 bg-orange-50/50 dark:border-orange-700 dark:bg-orange-950/20',
                      )}
                    >
                      <CardContent className="flex items-center gap-4 py-3">
                        {/* Rank */}
                        <RankDisplay rank={rank} locale={locale} />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold truncate">{displayedName}</span>
                            <Badge className="bg-[var(--sma-najm-700)] text-white text-[10px]">
                              {student.levelNameAr} ({num(student.level)})
                            </Badge>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2 flex items-center gap-3">
                            <div
                              className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden"
                              role="progressbar"
                              aria-valuenow={student.progressPercent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={t('progressToNext')}
                            >
                              <div
                                className="h-full rounded-full bg-success transition-all"
                                style={{ width: `${student.progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                              {num(student.progressPercent)}%
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm shrink-0">
                          <div className="text-center">
                            <div className="font-bold text-[var(--medal-gold)] tabular-nums">{num(student.xpTotal)}</div>
                            <div className="text-[10px] text-muted-foreground">{t('xpUnit')}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold tabular-nums">{num(student.badgesCount)}</div>
                            <div className="text-[10px] text-muted-foreground">{t('badgesCount')}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ---- Teams Tab ---- */}
          <TabsContent value="teams">
            {selected.teams.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">{t('noTeams')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selected.teams.map((team, idx) => {
                  const rank = idx + 1;

                  return (
                    <Card
                      key={team.teamId}
                      className={cn(
                        'transition-shadow hover:shadow-md',
                        rank === 1 && 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20',
                        rank === 2 && 'border-gray-300 bg-gray-50/50 dark:border-gray-600 dark:bg-gray-900/20',
                        rank === 3 && 'border-orange-300 bg-orange-50/50 dark:border-orange-700 dark:bg-orange-950/20',
                      )}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <RankDisplay rank={rank} locale={locale} />
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base truncate">
                              {team.nameAr}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground truncate">
                              {team.challengeTitleAr}
                            </p>
                          </div>
                          {team.color && (
                            <div
                              className="size-4 rounded-full border shrink-0"
                              style={{ backgroundColor: team.color }}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="size-3.5" aria-hidden="true" />
                            <span>{t('teamMembers', { count: num(team.memberCount) })}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-[var(--medal-gold)]">
                            <Star className="size-3.5" aria-hidden="true" />
                            <span className="tabular-nums">{num(team.totalXp)}</span>
                            <span className="text-xs font-normal">{t('xpUnit')}</span>
                          </div>
                        </div>

                        {/* Team XP visual bar */}
                        <div className="mt-2">
                          <div
                            className="h-2 w-full rounded-full bg-muted overflow-hidden"
                            role="progressbar"
                            aria-valuenow={team.totalXp}
                            aria-valuemin={0}
                            aria-valuemax={Math.max(...selected.teams.map((t) => t.totalXp), 1)}
                            aria-label={t('totalTeamXp')}
                          >
                            <div
                              className="h-full rounded-full bg-[var(--sma-najm-700)] transition-all"
                              style={{
                                width: `${Math.round(
                                  (team.totalXp / Math.max(...selected.teams.map((t) => t.totalXp), 1)) * 100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
