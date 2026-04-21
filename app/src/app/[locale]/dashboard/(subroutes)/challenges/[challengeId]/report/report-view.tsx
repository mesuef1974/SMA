'use client';

import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Users,
  Target,
  Zap,
  Clock,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toArabicIndic } from '@/lib/numerals';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamRanking {
  id: string;
  nameAr: string;
  color: string | null;
  score: number;
  correctCount: number;
  avgTimeMs: number;
  memberCount: number;
}

interface StudentPerf {
  participantId: string;
  studentId: string;
  name: string;
  teamNameAr: string;
  teamColor: string | null;
  correctCount: number;
  totalXP: number;
  avgTimeMs: number;
}

interface QuestionAccuracy {
  questionIndex: number;
  correctPercentage: number;
}

interface ChallengeReportData {
  challenge: {
    id: string;
    titleAr: string;
    questionCount: number;
    timeLimitSeconds: number;
    durationSeconds: number;
    startedAt: string | null;
    endedAt: string | null;
  };
  teamRankings: TeamRanking[];
  studentPerformance: StudentPerf[];
  questionAccuracy: QuestionAccuracy[];
  stats: {
    totalParticipants: number;
    avgScore: number;
    fastestCorrectMs: number;
    totalXPDistributed: number;
    fastestTeamNameAr: string | null;
    slowestTeamNameAr: string | null;
  };
}

interface ReportViewProps {
  report: ChallengeReportData;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${toArabicIndic(String(mins).padStart(2, '0'))}:${toArabicIndic(String(secs).padStart(2, '0'))}`;
}

function formatMs(ms: number): string {
  if (ms === 0) return '-';
  const seconds = (ms / 1000).toFixed(1);
  return `${toArabicIndic(seconds)}`;
}

function formatDate(isoString: string | null): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Podium medal colours
const MEDAL_STYLES = [
  { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-400', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-400' },
  { bg: 'bg-slate-100 dark:bg-slate-800/40', border: 'border-slate-400', text: 'text-slate-600 dark:text-slate-300', ring: 'ring-slate-400' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-500', text: 'text-orange-700 dark:text-orange-300', ring: 'ring-orange-500' },
] as const;

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportView({ report }: ReportViewProps) {
  const t = useTranslations('challengeReport');
  const { challenge, teamRankings, studentPerformance, questionAccuracy, stats } = report;

  // Find easiest and hardest questions
  const sortedByAccuracy = [...questionAccuracy].sort(
    (a, b) => b.correctPercentage - a.correctPercentage,
  );
  const easiestQ = sortedByAccuracy[0] ?? null;
  const hardestQ = sortedByAccuracy[sortedByAccuracy.length - 1] ?? null;

  return (
    <div className="space-y-8 print:space-y-6" dir="rtl">
      {/* ----------------------------------------------------------------- */}
      {/* Print button (hidden in print) */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between print:hidden">
        <div />
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer className="size-4" />
          {t('print')}
        </Button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* a. Challenge Summary Header */}
      {/* ----------------------------------------------------------------- */}
      <Card className="print:shadow-none print:border">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold">{challenge.titleAr}</h1>
            <p className="text-muted-foreground">
              {formatDate(challenge.startedAt)}
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="size-4" />
                {t('actualDuration')}: {formatDuration(challenge.durationSeconds)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-4" />
                {toArabicIndic(stats.totalParticipants)} {t('participant')}
              </span>
              <span className="flex items-center gap-1">
                <Target className="size-4" />
                {toArabicIndic(challenge.questionCount)} {t('question')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* e. Quick Stats (4 cards) */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
        <Card className="print:shadow-none print:border">
          <CardContent className="pt-6 text-center">
            <Users className="size-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">
              {toArabicIndic(stats.totalParticipants)}
            </div>
            <div className="text-sm text-muted-foreground">{t('totalParticipants')}</div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border">
          <CardContent className="pt-6 text-center">
            <Target className="size-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">
              {toArabicIndic(stats.avgScore)}%
            </div>
            <div className="text-sm text-muted-foreground">{t('avgScore')}</div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border">
          <CardContent className="pt-6 text-center">
            <Zap className="size-8 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">
              {formatMs(stats.fastestCorrectMs)} {t('secondsUnit')}
            </div>
            <div className="text-sm text-muted-foreground">{t('fastestCorrect')}</div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border">
          <CardContent className="pt-6 text-center">
            <Trophy className="size-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">
              {toArabicIndic(stats.totalXPDistributed)}
            </div>
            <div className="text-sm text-muted-foreground">{t('totalXPDistributed')}</div>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* b. Team Podium */}
      {/* ----------------------------------------------------------------- */}
      <Card className="print:shadow-none print:border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5" />
            {t('teamRankings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamRankings.length >= 1 ? (
            <div className="flex items-end justify-center gap-4 md:gap-8 py-4">
              {/* 2nd place (left) */}
              {teamRankings.length >= 2 && (
                <PodiumCard
                  team={teamRankings[1]}
                  rank={2}
                  style={MEDAL_STYLES[1]}
                  t={t}
                  className="w-36 md:w-44"
                />
              )}

              {/* 1st place (center, taller) */}
              <PodiumCard
                team={teamRankings[0]}
                rank={1}
                style={MEDAL_STYLES[0]}
                t={t}
                className="w-44 md:w-52 scale-110"
              />

              {/* 3rd place (right) */}
              {teamRankings.length >= 3 && (
                <PodiumCard
                  team={teamRankings[2]}
                  rank={3}
                  style={MEDAL_STYLES[2]}
                  t={t}
                  className="w-36 md:w-44"
                />
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t('noTeams')}
            </p>
          )}

          {/* Remaining teams (4th+) */}
          {teamRankings.length > 3 && (
            <div className="mt-6 space-y-2">
              {teamRankings.slice(3).map((team, i) => (
                <div
                  key={team.id}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <span className="text-lg font-bold min-w-[2rem] text-center text-muted-foreground">
                    {toArabicIndic(i + 4)}
                  </span>
                  <div
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: team.color ?? 'var(--muted-foreground)' }}
                  />
                  <span className="flex-1 font-medium">{team.nameAr}</span>
                  <span className="font-bold">{toArabicIndic(team.score)} XP</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* c. Question Accuracy (Bar Chart) */}
      {/* ----------------------------------------------------------------- */}
      <Card className="print:shadow-none print:border">
        <CardHeader>
          <CardTitle>{t('questionAccuracy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {questionAccuracy.map((q) => (
              <div key={q.questionIndex} className="flex items-center gap-3">
                <span className="text-sm font-medium min-w-[4rem] text-end">
                  {t('questionLabel', { number: toArabicIndic(q.questionIndex + 1) })}
                </span>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-end px-2"
                    style={{
                      width: `${Math.max(q.correctPercentage, 4)}%`,
                      backgroundColor:
                        q.correctPercentage >= 70
                          ? 'var(--success)'
                          : q.correctPercentage >= 40
                            ? 'var(--warning)'
                            : 'var(--destructive)',
                    }}
                  >
                    {q.correctPercentage >= 15 && (
                      <span className="text-xs font-bold text-white">
                        {toArabicIndic(q.correctPercentage)}%
                      </span>
                    )}
                  </div>
                </div>
                {q.correctPercentage < 15 && (
                  <span className="text-xs text-muted-foreground">
                    {toArabicIndic(q.correctPercentage)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Easiest / Hardest */}
          {questionAccuracy.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
              {easiestQ && (
                <Badge variant="outline" className="gap-1 px-3 py-1 text-green-700 dark:text-green-400 border-green-300">
                  {t('easiestQuestion')}: {t('questionLabel', { number: toArabicIndic(easiestQ.questionIndex + 1) })} ({toArabicIndic(easiestQ.correctPercentage)}%)
                </Badge>
              )}
              {hardestQ && (
                <Badge variant="outline" className="gap-1 px-3 py-1 text-red-700 dark:text-red-400 border-red-300">
                  {t('hardestQuestion')}: {t('questionLabel', { number: toArabicIndic(hardestQ.questionIndex + 1) })} ({toArabicIndic(hardestQ.correctPercentage)}%)
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* d. Student Table */}
      {/* ----------------------------------------------------------------- */}
      <Card className="print:shadow-none print:border">
        <CardHeader>
          <CardTitle>{t('studentPerformance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-start py-3 px-2 font-medium">{t('rank')}</th>
                  <th className="text-start py-3 px-2 font-medium">{t('studentName')}</th>
                  <th className="text-start py-3 px-2 font-medium">{t('team')}</th>
                  <th className="text-center py-3 px-2 font-medium">{t('correctAnswers')}</th>
                  <th className="text-center py-3 px-2 font-medium">{t('xpEarned')}</th>
                  <th className="text-center py-3 px-2 font-medium">{t('avgTime')}</th>
                </tr>
              </thead>
              <tbody>
                {studentPerformance.map((student, index) => (
                  <tr
                    key={student.participantId}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-3 px-2 font-bold">
                      {toArabicIndic(index + 1)}
                    </td>
                    <td className="py-3 px-2 font-medium">{student.name}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: student.teamColor ?? 'var(--muted-foreground)' }}
                        />
                        <span>{student.teamNameAr}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {toArabicIndic(student.correctCount)}
                    </td>
                    <td className="py-3 px-2 text-center font-bold">
                      {toArabicIndic(student.totalXP)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {formatMs(student.avgTimeMs)} {student.avgTimeMs > 0 ? t('secondsUnit') : ''}
                    </td>
                  </tr>
                ))}
                {studentPerformance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t('noStudents')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Print-friendly CSS */}
      {/* ----------------------------------------------------------------- */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          nav, header, aside, [data-sidebar], .print\\:hidden { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border { border: 1px solid var(--border) !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Podium Card Sub-component
// ---------------------------------------------------------------------------

function PodiumCard({
  team,
  rank,
  style,
  t,
  className = '',
}: {
  team: TeamRanking;
  rank: number;
  style: (typeof MEDAL_STYLES)[number];
  t: ReturnType<typeof useTranslations>;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${style.bg} ${style.border} ${className} print:scale-100`}
    >
      <span className="text-3xl" role="img" aria-label={`${t('rank')} ${rank}`}>
        {MEDAL_ICONS[rank - 1]}
      </span>
      <div
        className="size-4 rounded-full"
        style={{ backgroundColor: team.color ?? 'var(--muted-foreground)' }}
      />
      <h3 className={`text-lg font-bold text-center ${style.text}`}>
        {team.nameAr}
      </h3>
      <div className="text-2xl font-bold">
        {toArabicIndic(team.score)} <span className="text-sm font-normal">XP</span>
      </div>
      <div className="text-sm text-muted-foreground space-y-0.5 text-center">
        <div>
          {toArabicIndic(team.correctCount)} {t('correctLabel')}
        </div>
        <div>
          {formatMs(team.avgTimeMs)} {team.avgTimeMs > 0 ? t('avgTimeLabel') : ''}
        </div>
      </div>
    </div>
  );
}
