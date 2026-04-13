'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Plus,
  Play,
  Square,
  Users,
  Clock,
  HelpCircle,
  Swords,
} from 'lucide-react';
import { toArabicIndic } from '@/lib/numerals';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeData {
  id: string;
  titleAr: string;
  status: 'draft' | 'active' | 'completed';
  questionCount: number;
  timeLimitSeconds: number;
  classroomName: string;
  teamCount: number;
  participantCount: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

interface ClassroomOption {
  id: string;
  name: string;
  nameAr: string;
  studentsCount: number;
}

interface TeamScore {
  id: string;
  nameAr: string;
  color: string | null;
  score: number;
  correctCount: number;
}

interface SSEStatus {
  status: 'draft' | 'active' | 'completed';
  timeRemaining: number;
  questionCount: number;
  participantCount: number;
  responseCount: number;
}

interface ChallengesViewProps {
  challenges: ChallengeData[];
  classrooms: ClassroomOption[];
}

// ---------------------------------------------------------------------------
// Status badge styles
// ---------------------------------------------------------------------------

const statusStyles: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChallengesView({ challenges, classrooms }: ChallengesViewProps) {
  const t = useTranslations('challenge');

  // State
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [controllingId, setControllingId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<SSEStatus | null>(null);
  const [liveScores, setLiveScores] = useState<TeamScore[]>([]);
  const [challengeList, setChallengeList] = useState(challenges);

  // Form state
  const [classroomId, setClassroomId] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [teamCount, setTeamCount] = useState(2);
  const [createError, setCreateError] = useState('');

  // SSE ref
  const eventSourceRef = useRef<(() => void) | null>(null);

  // Format seconds to mm:ss Arabic
  const formatTime = useCallback(
    (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${toArabicIndic(String(mins).padStart(2, '0'))}:${toArabicIndic(String(secs).padStart(2, '0'))}`;
    },
    [],
  );

  // SSE connection for live challenge control
  useEffect(() => {
    if (!controllingId) return;

    let closed = false;

    const connect = () => {
      const controller = new AbortController();

      fetch(`/api/challenges/${controllingId}/stream`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.body) return;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (!closed) {
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
                    setLiveStatus(data as SSEStatus);
                  } else if (currentEvent === 'scores') {
                    setLiveScores(data.teams as TeamScore[]);
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
          // Connection lost — will be cleaned up
        });

      return () => {
        closed = true;
        controller.abort();
      };
    };

    const cleanup = connect();
    eventSourceRef.current = cleanup ?? null;

    return () => {
      closed = true;
      cleanup?.();
      eventSourceRef.current = null;
    };
  }, [controllingId]);

  // Create challenge handler
  async function handleCreate() {
    setCreateError('');
    if (!classroomId) {
      setCreateError(t('selectClassroom'));
      return;
    }
    if (!titleAr.trim()) {
      setCreateError(t('titleRequired'));
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          titleAr: titleAr.trim(),
          questionCount,
          timeLimitSeconds: timePerQuestion,
          teamCount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || t('createError'));
        return;
      }

      const data = await res.json();

      // Add to list and open control panel
      const classroom = classrooms.find((c) => c.id === classroomId);
      const newChallenge: ChallengeData = {
        id: data.challengeId,
        titleAr: titleAr.trim(),
        status: 'draft',
        questionCount,
        timeLimitSeconds: timePerQuestion * questionCount,
        classroomName: classroom?.nameAr ?? '',
        teamCount,
        participantCount: classroom?.studentsCount ?? 0,
        createdAt: new Date().toISOString(),
        startedAt: null,
        endedAt: null,
      };

      setChallengeList((prev) => [newChallenge, ...prev]);
      setShowCreate(false);
      setControllingId(data.challengeId);

      // Reset form
      setTitleAr('');
      setClassroomId('');
      setQuestionCount(5);
      setTimePerQuestion(30);
      setTeamCount(2);
    } catch {
      setCreateError(t('createError'));
    } finally {
      setCreating(false);
    }
  }

  // Start challenge
  async function handleStart(challengeId: string) {
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      if (res.ok) {
        setChallengeList((prev) =>
          prev.map((c) =>
            c.id === challengeId ? { ...c, status: 'active' as const } : c,
          ),
        );
      }
    } catch {
      // Handle error silently
    }
  }

  // End challenge
  async function handleEnd(challengeId: string) {
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      });

      if (res.ok) {
        setChallengeList((prev) =>
          prev.map((c) =>
            c.id === challengeId ? { ...c, status: 'completed' as const } : c,
          ),
        );
      }
    } catch {
      // Handle error silently
    }
  }

  // ---------------------------------------------------------------------------
  // Control panel for active challenge
  // ---------------------------------------------------------------------------
  if (controllingId) {
    const challenge = challengeList.find((c) => c.id === controllingId);
    const isActive = liveStatus?.status === 'active' || challenge?.status === 'active';
    const isCompleted = liveStatus?.status === 'completed' || challenge?.status === 'completed';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{challenge?.titleAr ?? t('controlPanel')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {challenge?.classroomName}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setControllingId(null);
              setLiveStatus(null);
              setLiveScores([]);
            }}
          >
            {t('backToList')}
          </Button>
        </div>

        {/* Timer and controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6">
              {/* Timer */}
              <div className="text-6xl font-mono font-bold tabular-nums">
                {formatTime(liveStatus?.timeRemaining ?? challenge?.timeLimitSeconds ?? 0)}
              </div>

              {/* Status badge */}
              <Badge
                className={statusStyles[liveStatus?.status ?? challenge?.status ?? 'draft']}
              >
                {t(liveStatus?.status ?? challenge?.status ?? 'draft')}
              </Badge>

              {/* Control buttons */}
              <div className="flex gap-4">
                {!isActive && !isCompleted && (
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-lg"
                    onClick={() => handleStart(controllingId)}
                  >
                    <Play className="size-5 me-2" />
                    {t('startChallenge')}
                  </Button>
                )}
                {isActive && !isCompleted && (
                  <Button
                    size="lg"
                    variant="destructive"
                    className="px-12 py-6 text-lg"
                    onClick={() => handleEnd(controllingId)}
                  >
                    <Square className="size-5 me-2" />
                    {t('endChallenge')}
                  </Button>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold">
                    {toArabicIndic(liveStatus?.participantCount ?? challenge?.participantCount ?? 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('participants')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {toArabicIndic(liveStatus?.responseCount ?? 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('responses')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {toArabicIndic(liveStatus?.questionCount ?? challenge?.questionCount ?? 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('questionsLabel')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5" />
              {t('leaderboard')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveScores.length > 0 ? (
              <div className="space-y-4">
                {liveScores.map((team, index) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                  >
                    <div
                      className="text-2xl font-bold min-w-[2.5rem] text-center"
                    >
                      {toArabicIndic(index + 1)}
                    </div>
                    <div
                      className="size-4 rounded-full shrink-0"
                      style={{ backgroundColor: team.color ?? '#666' }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{team.nameAr}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('correctAnswers', { count: team.correctCount })}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {toArabicIndic(team.score)} <span className="text-sm font-normal">XP</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t('noScoresYet')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main list view
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4 me-2" />
          {t('newChallenge')}
        </Button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{t('newChallenge')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Classroom select */}
              <div>
                <Label>{t('selectClassroom')}</Label>
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                >
                  <option value="">{t('selectClassroom')}</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} ({toArabicIndic(c.studentsCount)} {t('studentsLabel')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <Label>{t('challengeTitle')}</Label>
                <Input
                  className="mt-1"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder={t('challengeTitlePlaceholder')}
                />
              </div>

              {/* Question count */}
              <div>
                <Label>{t('questionsLabel')}</Label>
                <div className="flex gap-2 mt-1">
                  {[5, 10, 15].map((n) => (
                    <Button
                      key={n}
                      variant={questionCount === n ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setQuestionCount(n)}
                    >
                      {toArabicIndic(n)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time per question */}
              <div>
                <Label>{t('timePerQuestion')}</Label>
                <div className="flex gap-2 mt-1">
                  {[15, 30, 60].map((s) => (
                    <Button
                      key={s}
                      variant={timePerQuestion === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimePerQuestion(s)}
                    >
                      {toArabicIndic(s)} {t('seconds')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Team count */}
              <div>
                <Label>{t('teamCount')}</Label>
                <div className="flex gap-2 mt-1">
                  {[2, 3, 4].map((n) => (
                    <Button
                      key={n}
                      variant={teamCount === n ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTeamCount(n)}
                    >
                      {toArabicIndic(n)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? t('creating') : t('create')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false);
                    setCreateError('');
                  }}
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenge list */}
      {challengeList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Swords className="size-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t('noChallenges')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {challengeList.map((challenge) => (
            <Card
              key={challenge.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setControllingId(challenge.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{challenge.titleAr}</h3>
                      <Badge className={statusStyles[challenge.status]}>
                        {t(challenge.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {challenge.classroomName}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="size-4" />
                      {toArabicIndic(challenge.questionCount)} {t('questionsLabel')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-4" />
                      {toArabicIndic(challenge.participantCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      {formatTime(challenge.timeLimitSeconds)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
