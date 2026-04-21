'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, Trophy } from 'lucide-react';
import { toArabicIndic } from '@/lib/numerals';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamScore {
  id: string;
  nameAr: string;
  color: string | null;
  score: number;
  correctCount: number;
}

interface ChallengeStatus {
  titleAr: string;
  status: 'draft' | 'active' | 'completed';
  timeRemaining: number;
  timeLimitSeconds: number;
  questionCount: number;
  participantCount: number;
  responseCount: number;
}

interface ProjectorViewProps {
  challengeId: string;
  initialStatus: ChallengeStatus;
  initialTeams: TeamScore[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectorView({
  challengeId,
  initialStatus,
  initialTeams,
}: ProjectorViewProps) {
  const t = useTranslations('projector');

  const [status, setStatus] = useState<ChallengeStatus>(initialStatus);
  const [teams, setTeams] = useState<TeamScore[]>(initialTeams);
  const closedRef = useRef(false);

  // ------ Format seconds to mm:ss in Arabic numerals ------
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toArabicIndic(String(mins).padStart(2, '0'))}:${toArabicIndic(String(secs).padStart(2, '0'))}`;
  }, []);

  // ------ SSE connection ------
  useEffect(() => {
    closedRef.current = false;

    const controller = new AbortController();

    fetch(`/api/challenges/${challengeId}/stream`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!closedRef.current) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7);
            } else if (line.startsWith('data: ') && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                if (currentEvent === 'status') {
                  setStatus((prev) => ({
                    ...prev,
                    status: data.status,
                    timeRemaining: data.timeRemaining,
                    questionCount: data.questionCount,
                    participantCount: data.participantCount,
                    responseCount: data.responseCount,
                  }));
                } else if (currentEvent === 'scores') {
                  setTeams(data.teams as TeamScore[]);
                }
              } catch {
                // Ignore parse errors
              }
              currentEvent = '';
            }
          }
        }
      })
      .catch(() => {
        // Connection closed or aborted
      });

    return () => {
      closedRef.current = true;
      controller.abort();
    };
  }, [challengeId]);

  // ------ ESC key to close ------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        window.close();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ------ Compute max score for proportional bars ------
  const maxScore = Math.max(1, ...teams.map((t) => t.score));

  // ------ Status-specific rendering helpers ------
  const isDraft = status.status === 'draft';
  const isActive = status.status === 'active';
  const isCompleted = status.status === 'completed';

  const winnerTeam = isCompleted && teams.length > 0 ? teams[0] : null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white"
    >
      {/* Close button */}
      <button
        onClick={() => window.close()}
        className="absolute start-6 top-6 z-10 rounded-full bg-white/10 p-3 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
        aria-label={t('close')}
      >
        <X className="size-7" />
      </button>

      {/* ---------- DRAFT: Waiting ---------- */}
      {isDraft && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <h1 className="text-[4rem] font-bold leading-tight text-center px-8">
            {status.titleAr}
          </h1>
          <div className="animate-pulse text-[2.5rem] text-indigo-300">
            {t('waitingForStart')}
          </div>
          <div className="text-[1.5rem] text-white/50">
            {t('participantsCount', { count: status.participantCount })}
          </div>
        </div>
      )}

      {/* ---------- ACTIVE: Timer + Leaderboard ---------- */}
      {isActive && (
        <div className="flex flex-1 flex-col">
          {/* Title */}
          <div className="shrink-0 pt-8 pb-4 text-center">
            <h1 className="text-[3rem] font-bold leading-tight">
              {status.titleAr}
            </h1>
          </div>

          {/* Timer */}
          <div className="shrink-0 text-center pb-6">
            <div
              className={`inline-block font-mono font-bold tabular-nums transition-colors ${
                status.timeRemaining <= 10
                  ? 'text-red-400 animate-pulse'
                  : 'text-emerald-400'
              }`}
              style={{ fontSize: 'clamp(5rem, 10vw, 8rem)' }}
            >
              {formatTime(status.timeRemaining)}
            </div>
          </div>

          {/* Team bars */}
          <div className="flex-1 overflow-hidden px-12 pb-8">
            <div className="flex h-full flex-col justify-center gap-5">
              {teams.map((team, index) => {
                const barWidth =
                  maxScore > 0 ? Math.max(5, (team.score / maxScore) * 100) : 5;
                return (
                  <div
                    key={team.id}
                    className="transition-all duration-700 ease-in-out"
                    style={{ order: index }}
                  >
                    <div className="mb-2 flex items-baseline justify-between">
                      <div className="flex items-center gap-4">
                        <span
                          className="text-[2rem] font-bold"
                          style={{ minWidth: '2.5rem', textAlign: 'center' }}
                        >
                          {toArabicIndic(index + 1)}
                        </span>
                        <span className="text-[2rem] font-semibold">
                          {team.nameAr}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-[1.25rem] text-white/60">
                          {t('correctCount', { count: team.correctCount })}
                        </span>
                        <span className="text-[2.5rem] font-bold">
                          {toArabicIndic(team.score)}{' '}
                          <span className="text-[1.25rem] font-normal text-white/60">
                            XP
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="h-12 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-in-out"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: team.color ?? 'var(--team-1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {teams.length === 0 && (
                <div className="text-center text-[1.5rem] text-white/40">
                  {t('noScoresYet')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- COMPLETED: Winner ---------- */}
      {isCompleted && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="text-[3rem] font-bold text-amber-400">
            {t('challengeEnded')}
          </div>

          {winnerTeam && (
            <div className="flex flex-col items-center gap-4">
              <Trophy className="size-24 text-amber-400" />
              <div className="text-[4rem] font-bold" style={{ color: winnerTeam.color ?? 'var(--medal-gold)' }}>
                {winnerTeam.nameAr}
              </div>
              <div className="text-[2.5rem] text-white/80">
                {toArabicIndic(winnerTeam.score)} XP
              </div>
            </div>
          )}

          {/* Final leaderboard */}
          <div className="mt-8 w-full max-w-3xl space-y-4 px-8">
            {teams.map((team, index) => (
              <div
                key={team.id}
                className="flex items-center gap-6 rounded-2xl bg-white/10 px-8 py-5 backdrop-blur-sm"
              >
                <span className="text-[2rem] font-bold" style={{ minWidth: '2.5rem', textAlign: 'center' }}>
                  {toArabicIndic(index + 1)}
                </span>
                <div
                  className="size-5 shrink-0 rounded-full"
                  style={{ backgroundColor: team.color ?? 'var(--muted-foreground)' }}
                />
                <span className="flex-1 text-[1.75rem] font-semibold">
                  {team.nameAr}
                </span>
                <span className="text-[1.25rem] text-white/60">
                  {t('correctCount', { count: team.correctCount })}
                </span>
                <span className="text-[2rem] font-bold">
                  {toArabicIndic(team.score)} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
