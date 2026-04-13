'use client';

/**
 * ResultsView — client component that displays exercise results.
 *
 * Shows:
 * - Overall score (X/Y correct)
 * - Per-question breakdown: question text, student answer, correct answer, check/cross
 * - Bloom level badge per question
 * - Back to dashboard button
 */

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MathText } from '@/components/math/math-display';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedbackItem {
  questionId: string;
  questionText: string;
  questionTextAr: string;
  questionType: string | null;
  bloomLevel: string | null;
  studentResponse: string;
  correctAnswer: string | null;
  isCorrect: boolean;
  points: number;
  earnedPoints: number;
}

interface ResultsData {
  totalQuestions: number;
  correctCount: number;
  score: number;
  feedback: FeedbackItem[];
}

interface ResultsViewProps {
  data: ResultsData | null;
  assessmentId: string;
  locale: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResultsView({ data, locale }: ResultsViewProps) {
  const t = useTranslations('exercise');
  const isRTL = locale === 'ar';

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-muted-foreground">{t('notFound')}</p>
            <Link href="/student/dashboard">
              <Button variant="outline" className="mt-4">
                {t('backToDashboard')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totalQuestions, correctCount, score, feedback } = data;
  const scoreColor =
    score >= 70 ? 'text-green-600 dark:text-green-400' :
    score >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
    'text-red-600 dark:text-red-400';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Score summary card */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('resultsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className={`text-5xl font-bold ${scoreColor}`}>
            {score}%
          </div>
          <p className="mt-2 text-lg text-muted-foreground">
            {t('score', { correct: correctCount, total: totalQuestions })}
          </p>
        </CardContent>
      </Card>

      {/* Per-question feedback */}
      <div className="space-y-4">
        {feedback.map((item, index) => {
          const questionText = isRTL ? item.questionTextAr : item.questionText;
          // Remove MCQ options from displayed text (show only stem)
          const displayText = item.questionType === 'multiple_choice'
            ? questionText.split('\n')[0]
            : questionText;

          return (
            <Card
              key={item.questionId}
              className={`border-s-4 ${
                item.isCorrect
                  ? 'border-s-green-500'
                  : 'border-s-red-500'
              }`}
            >
              <CardContent className="py-4">
                {/* Question number + Bloom badge */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.isCorrect ? (
                      <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="size-5 text-red-600 dark:text-red-400" />
                    )}
                    <span className="text-sm font-medium text-muted-foreground">
                      {t('questionOf', { current: index + 1, total: totalQuestions })}
                    </span>
                  </div>
                  {item.bloomLevel && (
                    <Badge variant="secondary">
                      {t(`bloomLevels.${item.bloomLevel}` as Parameters<typeof t>[0])}
                    </Badge>
                  )}
                </div>

                {/* Question text */}
                <p className="mb-3 text-base font-medium leading-relaxed">
                  <MathText text={displayText} />
                </p>

                {/* Student answer */}
                <div className="mb-2 flex items-start gap-2 text-sm">
                  <span className="shrink-0 font-medium text-muted-foreground">
                    {t('yourAnswer')}:
                  </span>
                  <span className={item.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {item.studentResponse ? (
                      item.questionType === 'math_input' ? (
                        <MathText text={`$${item.studentResponse}$`} />
                      ) : (
                        item.studentResponse
                      )
                    ) : (
                      <span className="italic">{t('unanswered')}</span>
                    )}
                  </span>
                </div>

                {/* Correct answer (shown for incorrect) */}
                {!item.isCorrect && item.correctAnswer && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="shrink-0 font-medium text-muted-foreground">
                      {t('correctAnswer')}:
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      {item.questionType === 'math_input' ? (
                        <MathText text={`$${item.correctAnswer}$`} />
                      ) : (
                        item.correctAnswer
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Back to dashboard */}
      <div className="mt-8 text-center">
        <Link href="/student/dashboard">
          <Button size="lg" variant="outline">
            {isRTL ? (
              <ArrowRight className="size-4" data-icon="inline-start" />
            ) : (
              <ArrowLeft className="size-4" data-icon="inline-start" />
            )}
            {t('backToDashboard')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
