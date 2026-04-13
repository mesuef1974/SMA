'use client';

/**
 * ExerciseView — client component for the interactive exercise wizard.
 *
 * Renders questions one at a time (stepper/wizard pattern).
 * Supports: multiple_choice, short_answer, math_input question types.
 * On submit, POSTs responses to /api/student/submit-responses and
 * redirects to the results page.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { MathInput } from '@/components/math/math-input';
import { MathText } from '@/components/math/math-display';
import { ChevronRight, ChevronLeft, Send, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Question {
  id: string;
  questionText: string;
  questionTextAr: string;
  questionType: 'multiple_choice' | 'short_answer' | 'essay' | 'math_input' | null;
  bloomLevel: string | null;
  points: number | null;
  sortOrder: number | null;
}

interface ExerciseViewProps {
  assessmentId: string;
  title: string;
  questions: Question[];
  studentId: string;
  locale: string;
  noQuestionsText: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse MCQ options from the question text.
 * Expects format: "Question text\nA) Option A\nB) Option B\nC) Option C\nD) Option D"
 * or "Question text\n(أ) خيار\n(ب) خيار\n(ج) خيار\n(د) خيار"
 */
function parseMCQOptions(text: string): { stem: string; options: { key: string; text: string }[] } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const options: { key: string; text: string }[] = [];
  let stemEnd = lines.length;

  // Match patterns like: A) ..., B) ..., (أ) ..., (ب) ...
  const optionRegex = /^(?:([A-Da-d])\)|[\(]([أبجد]|[ابتثجحخدذ])[\)])\s*(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(optionRegex);
    if (match) {
      if (stemEnd === lines.length) stemEnd = i;
      const key = match[1] || match[2];
      const optionText = match[3];
      options.push({ key, text: optionText });
    }
  }

  const stem = lines.slice(0, stemEnd).join('\n');
  return { stem, options };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExerciseView({
  assessmentId,
  title,
  questions,
  studentId,
  locale,
  noQuestionsText,
}: ExerciseViewProps) {
  const t = useTranslations('exercise');
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];

  const setResponse = useCallback((questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalQuestions]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        assessmentId,
        studentId,
        responses: questions.map((q) => ({
          questionId: q.id,
          response: responses[q.id] ?? '',
        })),
      };

      const res = await fetch('/api/student/submit-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || t('submitError'));
      }

      const result = await res.json();

      // Navigate to results page with data in search params
      const resultsUrl = `/${locale === 'ar' ? '' : locale + '/'}student/exercise/${assessmentId}/results?data=${encodeURIComponent(JSON.stringify(result))}`;
      router.push(resultsUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('submitError'));
      setSubmitting(false);
    }
  }, [assessmentId, studentId, questions, responses, t, locale, router]);

  if (totalQuestions === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-muted-foreground">{noQuestionsText}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const questionText = isRTL ? currentQuestion.questionTextAr : currentQuestion.questionText;
  const currentResponse = responses[currentQuestion.id] ?? '';
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <Progress value={progressPercent}>
          <ProgressLabel>
            {t('questionOf', { current: currentIndex + 1, total: totalQuestions })}
          </ProgressLabel>
          <ProgressValue>{() => `${progressPercent}%`}</ProgressValue>
        </Progress>
      </div>

      {/* Question card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">
            <MathText text={questionText} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionInput
            question={currentQuestion}
            value={currentResponse}
            onChange={(val) => setResponse(currentQuestion.id, val)}
            locale={locale}
          />
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div
          className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentIndex === 0 || submitting}
        >
          {isRTL ? (
            <ChevronRight className="size-4" data-icon="inline-start" />
          ) : (
            <ChevronLeft className="size-4" data-icon="inline-start" />
          )}
          {t('previous')}
        </Button>

        {isLastQuestion ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                {t('submitting')}
              </>
            ) : (
              <>
                <Send className="size-4" data-icon="inline-start" />
                {t('submit')}
              </>
            )}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={submitting}>
            {t('next')}
            {isRTL ? (
              <ChevronLeft className="size-4" data-icon="inline-end" />
            ) : (
              <ChevronRight className="size-4" data-icon="inline-end" />
            )}
          </Button>
        )}
      </div>

      {/* Question dots navigation */}
      <div className="mt-6 flex flex-wrap justify-center gap-2" role="navigation" aria-label="Questions">
        {questions.map((q, i) => {
          const answered = !!responses[q.id];
          const isCurrent = i === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : answered
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
              aria-label={`${t('questionOf', { current: i + 1, total: totalQuestions })}${answered ? ' - ' + t('correct') : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuestionInput — renders the appropriate input for each question type
// ---------------------------------------------------------------------------

function QuestionInput({
  question,
  value,
  onChange,
  locale,
}: {
  question: Question;
  value: string;
  onChange: (val: string) => void;
  locale: string;
}) {
  const t = useTranslations('exercise');
  const isRTL = locale === 'ar';
  const questionText = isRTL ? question.questionTextAr : question.questionText;

  switch (question.questionType) {
    case 'multiple_choice': {
      const { options } = parseMCQOptions(questionText);

      // Fallback: if no options parsed, render as short answer
      if (options.length === 0) {
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('typeAnswer')}
            className="text-base"
          />
        );
      }

      return (
        <div className="space-y-3" role="radiogroup" aria-label={t('selectAnswer')}>
          {options.map((opt) => {
            const isSelected = value === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange(opt.key)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-start text-sm transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-background text-foreground hover:bg-muted'
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {opt.key}
                </span>
                <span className="flex-1">
                  <MathText text={opt.text} />
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    case 'math_input':
      return (
        <MathInput
          value={value}
          onChange={onChange}
          placeholder={t('mathPlaceholder')}
        />
      );

    case 'short_answer':
    case 'essay':
    default:
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('typeAnswer')}
          className="text-base"
        />
      );
  }
}
