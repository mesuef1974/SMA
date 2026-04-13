'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Star,
} from 'lucide-react';
import { toArabicIndic } from '@/lib/numerals';
import { useToast } from '@/components/ui/toast-provider';

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

interface SSEStatus {
  status: 'draft' | 'active' | 'completed';
  timeRemaining: number;
  questionCount: number;
  participantCount: number;
  responseCount: number;
}

interface AnswerResult {
  questionIndex: number;
  isCorrect: boolean;
  xpEarned: number;
}

interface ChallengeViewProps {
  challengeId: string;
  titleAr: string;
  questionCount: number;
  timeLimitSeconds: number;
  teamNameAr: string;
  teamColor: string;
  participantId: string;
  locale: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChallengeView(props: ChallengeViewProps) {
  const {
    challengeId,
    titleAr,
    questionCount,
    teamNameAr,
    teamColor,
  } = props;
  const t = useTranslations('challenge');
  const { showCorrectToast, showXPToast } = useToast();

  // State
  const [status, setStatus] = useState<SSEStatus | null>(null);
  const [scores, setScores] = useState<TeamScore[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Map<number, AnswerResult>>(new Map());
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [totalXP, setTotalXP] = useState(0);

  const isCompleted = status?.status === 'completed';
  const isDraft = !status || status.status === 'draft';

  // Format time as mm:ss Arabic
  const formatTime = useCallback(
    (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${toArabicIndic(String(mins).padStart(2, '0'))}:${toArabicIndic(String(secs).padStart(2, '0'))}`;
    },
    [],
  );

  // SSE connection
  useEffect(() => {
    let closed = false;

    const connect = () => {
      const controller = new AbortController();

      fetch(`/api/challenges/${challengeId}/stream`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.body) return;
          const reader = res.body.getReader();
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
                    setStatus(data as SSEStatus);
                  } else if (currentEvent === 'scores') {
                    setScores(data.teams as TeamScore[]);
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
          // Connection lost
        });

      return () => {
        closed = true;
        controller.abort();
      };
    };

    const cleanup = connect();

    return () => {
      closed = true;
      cleanup?.();
    };
  }, [challengeId]);

  // Submit answer
  async function handleSubmit() {
    if (!response.trim() || submitting) return;

    setSubmitting(true);
    setLastResult(null);

    try {
      const res = await fetch(`/api/challenges/${challengeId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex: currentQuestion,
          response: response.trim(),
          isCorrect: true, // In a full implementation, this comes from the question data
          timeMs: 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const result: AnswerResult = {
          questionIndex: currentQuestion,
          isCorrect: data.isCorrect,
          xpEarned: data.xpEarned,
        };

        setResults((prev) => new Map(prev).set(currentQuestion, result));
        setLastResult(result);
        setTotalXP((prev) => prev + data.xpEarned);
        setResponse('');

        // Show toasts for correct answers
        if (data.isCorrect) {
          showCorrectToast();
          showXPToast(data.xpEarned);
        }

        // Auto-advance to next question after 1.5s
        if (currentQuestion < questionCount - 1) {
          setTimeout(() => {
            setCurrentQuestion((prev) => prev + 1);
            setLastResult(null);
          }, 1500);
        }
      }
    } catch {
      // Handle error silently
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Waiting screen (before challenge starts)
  // ---------------------------------------------------------------------------
  if (isDraft) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <Loader2 className="size-12 mx-auto mb-4 animate-spin text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">{titleAr}</h2>
            <div className="inline-flex items-center gap-2 mb-4">
              <div
                className="size-3 rounded-full"
                style={{ backgroundColor: teamColor }}
              />
              <span className="font-semibold">{teamNameAr}</span>
            </div>
            <p className="text-muted-foreground">{t('waitingForStart')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Results screen (after challenge ends)
  // ---------------------------------------------------------------------------
  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6 pt-8">
        {/* Header */}
        <div className="text-center">
          <Trophy className="size-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-2">{t('challengeEnded')}</h1>
          <p className="text-lg text-muted-foreground">{titleAr}</p>
        </div>

        {/* Your stats */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="size-4 rounded-full"
                  style={{ backgroundColor: teamColor }}
                />
                <span className="font-semibold text-lg">{teamNameAr}</span>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">
                  {toArabicIndic(totalXP)} XP
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('correctAnswers', {
                    count: Array.from(results.values()).filter((r) => r.isCorrect).length,
                  })}
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
            <div className="space-y-3">
              {scores.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className="text-xl font-bold min-w-[2rem] text-center">
                    {toArabicIndic(index + 1)}
                  </div>
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: team.color ?? '#666' }}
                  />
                  <div className="flex-1 font-semibold">{team.nameAr}</div>
                  <div className="font-bold">
                    {toArabicIndic(team.score)} XP
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Active challenge — question answering
  // ---------------------------------------------------------------------------
  const alreadyAnswered = results.has(currentQuestion);
  const allAnswered = results.size >= questionCount;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 pt-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="size-3 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <span className="font-semibold text-sm">{teamNameAr}</span>
        </div>
        <div className="flex items-center gap-2 text-lg font-mono font-bold">
          <Clock className="size-5" />
          {formatTime(status?.timeRemaining ?? 0)}
        </div>
        <Badge variant="outline">
          <Star className="size-3 me-1" />
          {toArabicIndic(totalXP)} XP
        </Badge>
      </div>

      {/* Question counter */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t('questionOf', {
            current: toArabicIndic(currentQuestion + 1),
            total: toArabicIndic(questionCount),
          })}
        </p>
        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-2">
          {Array.from({ length: questionCount }, (_, i) => {
            const result = results.get(i);
            let bg = 'bg-zinc-200 dark:bg-zinc-700';
            if (result?.isCorrect) bg = 'bg-green-500';
            else if (result && !result.isCorrect) bg = 'bg-red-500';
            else if (i === currentQuestion) bg = 'bg-primary';
            return (
              <button
                key={i}
                type="button"
                className={`size-3 rounded-full transition-colors ${bg}`}
                onClick={() => {
                  if (!results.has(i)) setCurrentQuestion(i);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Question card */}
      <Card>
        <CardContent className="py-8">
          {allAnswered ? (
            <div className="text-center space-y-4">
              <CheckCircle className="size-16 mx-auto text-green-500" />
              <h2 className="text-xl font-bold">{t('allAnswered')}</h2>
              <p className="text-muted-foreground">{t('waitingForEnd')}</p>
              <div className="text-2xl font-bold">
                {toArabicIndic(totalXP)} XP
              </div>
            </div>
          ) : alreadyAnswered ? (
            <div className="text-center space-y-4">
              {results.get(currentQuestion)?.isCorrect ? (
                <>
                  <CheckCircle className="size-16 mx-auto text-green-500" />
                  <p className="text-lg font-bold text-green-600">
                    {t('correctAnswer')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    +{toArabicIndic(results.get(currentQuestion)?.xpEarned ?? 0)} XP
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="size-16 mx-auto text-red-500" />
                  <p className="text-lg font-bold text-red-600">
                    {t('wrongAnswer')}
                  </p>
                </>
              )}
              {currentQuestion < questionCount - 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = Array.from(
                      { length: questionCount },
                      (_, i) => i,
                    ).find((i) => i > currentQuestion && !results.has(i));
                    if (next !== undefined) {
                      setCurrentQuestion(next);
                      setLastResult(null);
                    }
                  }}
                >
                  {t('nextQuestion')}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-center">
                {t('questionLabel', { number: toArabicIndic(currentQuestion + 1) })}
              </h2>

              {/* Answer input */}
              <div className="space-y-3">
                <Input
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder={t('typeAnswer')}
                  className="text-center text-lg py-6"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                  disabled={submitting}
                  autoFocus
                />
                <Button
                  className="w-full py-6 text-lg"
                  onClick={handleSubmit}
                  disabled={!response.trim() || submitting}
                >
                  {submitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    t('submitAnswer')
                  )}
                </Button>
              </div>

              {/* Last result feedback */}
              {lastResult && (
                <div className="text-center">
                  {lastResult.isCorrect ? (
                    <p className="text-green-600 font-bold">
                      {t('correctAnswer')} +{toArabicIndic(lastResult.xpEarned)} XP
                    </p>
                  ) : (
                    <p className="text-red-600 font-bold">{t('wrongAnswer')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mini leaderboard */}
      {scores.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-around">
              {scores.slice(0, 4).map((team) => (
                <div key={team.id} className="text-center">
                  <div
                    className="size-3 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: team.color ?? '#666' }}
                  />
                  <div className="text-xs font-semibold truncate max-w-[5rem]">
                    {team.nameAr}
                  </div>
                  <div className="text-sm font-bold">
                    {toArabicIndic(team.score)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
