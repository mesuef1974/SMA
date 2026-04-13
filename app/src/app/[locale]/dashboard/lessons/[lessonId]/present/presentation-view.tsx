'use client';

/**
 * PresentationView — full-screen, projector-friendly slide show.
 *
 * Converts a 9-section lesson plan into discrete slides that the teacher
 * can navigate with keyboard arrows, on-screen buttons, or (later) swipe.
 *
 * Design:
 *   - Dark gradient background (always dark, independent of system theme)
 *   - Large, projector-friendly typography (min 24px body, 48px headers)
 *   - RTL layout
 *   - Full viewport height (100vh, no scrollbar)
 *   - No sidebar/header — clean presentation
 *   - ESC / X button to exit back to the lesson
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Target,
  Lightbulb,
  Compass,
  GraduationCap,
  PenTool,
  ClipboardCheck,
  Rocket,
  BookOpen,
} from 'lucide-react';
import { MathDisplay, MathText } from '@/components/math/math-display';
import { cn } from '@/lib/utils';
import type { LessonPlanData, BloomLevel, Tier } from '@/lib/lesson-plans/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonInfo {
  id: string;
  titleAr: string;
  title: string;
  number: string;
  chapter: {
    number: number;
    titleAr: string;
  } | null;
}

interface PresentationViewProps {
  lesson: LessonInfo;
  plan: Record<string, unknown>;
  periodNumber: number;
  locale: string;
  lessonId: string;
}

interface Slide {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  render: () => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Bloom / Tier mappings (presentation-sized)
// ---------------------------------------------------------------------------

const bloomColors: Record<string, string> = {
  remember: 'bg-zinc-700 text-zinc-200',
  understand: 'bg-blue-800 text-blue-100',
  apply: 'bg-green-800 text-green-100',
  analyze: 'bg-amber-800 text-amber-100',
  evaluate: 'bg-orange-800 text-orange-100',
  create: 'bg-purple-800 text-purple-100',
};

const bloomLabels: Record<string, string> = {
  remember: 'تذكّر',
  understand: 'فهم',
  apply: 'تطبيق',
  analyze: 'تحليل',
  evaluate: 'تقويم',
  create: 'إبداع',
};

const tierLabels: Record<string, string> = {
  approaching: 'دون المستوى',
  meeting: 'ضمن المستوى',
  exceeding: 'فوق المستوى',
};

const tierColors: Record<string, string> = {
  approaching: 'bg-red-800 text-red-100',
  meeting: 'bg-blue-800 text-blue-100',
  exceeding: 'bg-emerald-800 text-emerald-100',
};

const questionTypeLabels: Record<string, string> = {
  mcq: 'اختيار من متعدد',
  short_answer: 'إجابة قصيرة',
  problem_solving: 'حل مسائل',
};

// ---------------------------------------------------------------------------
// Presentation badge components
// ---------------------------------------------------------------------------

function PresentBloomBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-4 py-1.5 text-lg font-bold',
        bloomColors[level] ?? 'bg-zinc-700 text-zinc-200',
      )}
    >
      {bloomLabels[level] ?? level}
    </span>
  );
}

function PresentTierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-4 py-1.5 text-lg font-bold',
        tierColors[tier] ?? 'bg-zinc-700 text-zinc-200',
      )}
    >
      {tierLabels[tier] ?? tier}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helper: detect and render math content
// ---------------------------------------------------------------------------

function PresentMathText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      <MathText text={text} className="[&_.katex]:text-[1.4em]" />
    </span>
  );
}

function PresentFormula({ formula }: { formula: string }) {
  const hasLatex = /[\\^_{}]/.test(formula) || /\$/.test(formula);
  if (hasLatex) {
    const cleaned = formula.replace(/^\$\$?|\$\$?$/g, '').trim();
    return (
      <div className="my-4 rounded-xl bg-white/10 p-6 text-center">
        <MathDisplay latex={cleaned} display className="[&_.katex]:text-[2em]" />
      </div>
    );
  }
  return (
    <div className="my-4 rounded-xl bg-white/10 p-6 text-center text-2xl">
      <PresentMathText text={formula} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slide builders
// ---------------------------------------------------------------------------

function buildSlides(plan: LessonPlanData, lesson: LessonInfo, periodNumber: number): Slide[] {
  const slides: Slide[] = [];

  // --- Slide 1: Header ---
  slides.push({
    id: 'header',
    title: 'عنوان الدرس',
    icon: BookOpen,
    render: () => (
      <div className="flex h-full flex-col items-center justify-center text-center gap-8">
        {lesson.chapter && (
          <p className="text-2xl text-zinc-400">
            الفصل {lesson.chapter.number}: {lesson.chapter.titleAr}
          </p>
        )}
        <h1 className="text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
          {plan.header.lesson_title_ar}
        </h1>
        {plan.header.lesson_title_en && (
          <p className="text-2xl text-zinc-400" dir="ltr">
            {plan.header.lesson_title_en}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xl text-zinc-400">
          <span>الحصة {periodNumber}</span>
          {plan.header.unit_number != null && <span>الوحدة {plan.header.unit_number}</span>}
          {plan.header.teacher_guide_pages && (
            <span>دليل المعلم: ص {plan.header.teacher_guide_pages}</span>
          )}
        </div>
      </div>
    ),
  });

  // --- Slide 2: Learning Outcomes ---
  if (plan.learning_outcomes?.length) {
    slides.push({
      id: 'outcomes',
      title: 'مخرجات التعلم',
      icon: Target,
      render: () => (
        <div className="flex h-full flex-col justify-center gap-8 px-4">
          <h2 className="text-4xl font-bold text-center mb-4 md:text-5xl">مخرجات التعلم</h2>
          <ul className="space-y-6 max-w-4xl mx-auto w-full">
            {plan.learning_outcomes.map((outcome, i) => (
              <li key={i} className="flex items-start gap-5">
                <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <p className="text-2xl leading-relaxed md:text-3xl">
                    {outcome.outcome_ar}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <PresentBloomBadge level={outcome.bloom_level} />
                    {outcome.action_verb_ar && (
                      <span className="inline-flex items-center rounded-lg border border-zinc-600 px-4 py-1.5 text-lg text-zinc-300">
                        {outcome.action_verb_ar}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  // --- Slide 3: Warm-Up ---
  slides.push({
    id: 'warm_up',
    title: 'التهيئة',
    icon: Lightbulb,
    render: () => (
      <div className="flex h-full flex-col justify-center gap-8 px-4">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold md:text-5xl">التهيئة</h2>
          <p className="text-xl text-zinc-400">{plan.warm_up.duration_minutes} دقائق</p>
        </div>
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <p className="text-2xl leading-relaxed text-center md:text-3xl">
            <PresentMathText text={plan.warm_up.activity_ar} />
          </p>
          {plan.warm_up.prerequisite_concepts && plan.warm_up.prerequisite_concepts.length > 0 && (
            <div className="text-center">
              <p className="text-lg text-zinc-400 mb-3">المفاهيم المطلوبة:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {plan.warm_up.prerequisite_concepts.map((concept, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-white/10 px-4 py-2 text-xl"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
  });

  // --- Slide 4: Explore ---
  slides.push({
    id: 'explore',
    title: 'الاستكشاف',
    icon: Compass,
    render: () => (
      <div className="flex h-full flex-col justify-center gap-6 px-4">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold md:text-5xl">الاستكشاف</h2>
          <p className="text-xl text-zinc-400">{plan.explore.duration_minutes} دقائق</p>
        </div>
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <p className="text-2xl leading-relaxed text-center md:text-3xl">
            <PresentMathText text={plan.explore.activity_ar} />
          </p>
          {plan.explore.guiding_questions && plan.explore.guiding_questions.length > 0 && (
            <div>
              <p className="text-xl text-zinc-400 mb-3 text-center">أسئلة موجّهة:</p>
              <ul className="space-y-3 max-w-3xl mx-auto">
                {plan.explore.guiding_questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 text-xl leading-relaxed">
                    <span className="mt-1 text-zinc-500 shrink-0">&#9679;</span>
                    <PresentMathText text={q} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    ),
  });

  // --- Slide 5: Explain ---
  slides.push({
    id: 'explain',
    title: 'الشرح',
    icon: GraduationCap,
    render: () => (
      <div className="flex h-full flex-col justify-center gap-6 px-4 overflow-y-auto">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold md:text-5xl">الشرح</h2>
          <p className="text-xl text-zinc-400">{plan.explain.duration_minutes} دقائق</p>
        </div>
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <p className="text-2xl leading-relaxed text-center">
            <PresentMathText text={plan.explain.concept_ar} />
          </p>

          {/* Key Vocabulary */}
          {plan.explain.key_vocabulary && plan.explain.key_vocabulary.length > 0 && (
            <div className="text-center">
              <p className="text-xl text-zinc-400 mb-3">المفردات الرياضية:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {plan.explain.key_vocabulary.map((word, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-blue-900/40 border border-blue-700/50 px-4 py-2 text-xl text-blue-100"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Formulas */}
          {plan.explain.formulas && plan.explain.formulas.length > 0 && (
            <div>
              <p className="text-xl text-zinc-400 mb-3 text-center">القوانين:</p>
              {plan.explain.formulas.map((formula, i) => (
                <PresentFormula key={i} formula={formula} />
              ))}
            </div>
          )}

          {/* Worked Examples */}
          {plan.explain.worked_examples && plan.explain.worked_examples.length > 0 && (
            <div>
              <p className="text-xl text-zinc-400 mb-3 text-center">أمثلة محلولة:</p>
              <div className="space-y-4">
                {plan.explain.worked_examples.map((example, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-600 bg-white/5 p-5 text-xl leading-relaxed"
                  >
                    <span className="font-bold text-amber-400 me-2">مثال {i + 1}:</span>
                    <PresentMathText text={example} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
  });

  // --- Slide 6: Practice (one item per slide) ---
  if (plan.practice?.items?.length) {
    plan.practice.items.forEach((item, i) => {
      slides.push({
        id: `practice-${i}`,
        title: `تمرين ${i + 1}`,
        icon: PenTool,
        render: () => (
          <div className="flex h-full flex-col justify-center gap-8 px-4">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold md:text-5xl">التمارين</h2>
              <p className="text-xl text-zinc-400">
                تمرين {i + 1} من {plan.practice.items.length}
              </p>
            </div>
            <div className="max-w-4xl mx-auto w-full space-y-6">
              <div className="rounded-xl bg-white/5 border border-zinc-600 p-8">
                <div className="flex items-start gap-5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl font-bold">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-2xl leading-relaxed md:text-3xl">
                    <PresentMathText text={item.question_ar} />
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 mt-6 ms-16">
                  {item.bloom_level && <PresentBloomBadge level={item.bloom_level} />}
                  {item.tier && <PresentTierBadge tier={item.tier} />}
                  {item.source_page && (
                    <span className="inline-flex items-center rounded-lg border border-zinc-600 px-4 py-1.5 text-lg text-zinc-400">
                      ص {item.source_page}
                    </span>
                  )}
                </div>
              </div>
              {item.expected_answer && (
                <div className="rounded-xl bg-emerald-900/20 border border-emerald-700/50 p-6 text-xl">
                  <span className="font-bold text-emerald-400 me-2">الإجابة المتوقعة:</span>
                  <PresentMathText text={item.expected_answer} />
                </div>
              )}
            </div>
          </div>
        ),
      });
    });
  }

  // --- Slide 7: Assess ---
  if (plan.assess?.items?.length) {
    plan.assess.items.forEach((item, i) => {
      slides.push({
        id: `assess-${i}`,
        title: `تقويم ${i + 1}`,
        icon: ClipboardCheck,
        render: () => (
          <div className="flex h-full flex-col justify-center gap-8 px-4">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold md:text-5xl">التقويم</h2>
              <p className="text-xl text-zinc-400">
                سؤال {i + 1} من {plan.assess.items.length}
              </p>
            </div>
            <div className="max-w-4xl mx-auto w-full space-y-6">
              <div className="rounded-xl bg-white/5 border border-zinc-600 p-8">
                <div className="flex items-start gap-5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl font-bold">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-2xl leading-relaxed md:text-3xl">
                    <PresentMathText text={item.question_ar} />
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 mt-6 ms-16">
                  {item.type && (
                    <span className="inline-flex items-center rounded-lg border border-zinc-600 px-4 py-1.5 text-lg text-zinc-300">
                      {questionTypeLabels[item.type] ?? item.type}
                    </span>
                  )}
                  {item.bloom_level && <PresentBloomBadge level={item.bloom_level} />}
                </div>
              </div>
              {item.model_answer_ar && (
                <div className="rounded-xl bg-emerald-900/20 border border-emerald-700/50 p-6 text-xl">
                  <span className="font-bold text-emerald-400 me-2">الإجابة النموذجية:</span>
                  <PresentMathText text={item.model_answer_ar} />
                </div>
              )}
            </div>
          </div>
        ),
      });
    });
  }

  // --- Slide 8: Extend (optional) ---
  if (plan.extend) {
    slides.push({
      id: 'extend',
      title: 'الإثراء',
      icon: Rocket,
      render: () => (
        <div className="flex h-full flex-col justify-center gap-8 px-4">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold md:text-5xl">الإثراء</h2>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="inline-flex items-center rounded-lg bg-purple-800 px-4 py-1.5 text-lg font-bold text-purple-100">
                اختياري
              </span>
              <span className="text-xl text-zinc-400">{plan.extend?.duration_minutes} دقائق</span>
            </div>
          </div>
          <div className="max-w-4xl mx-auto w-full">
            <div className="rounded-xl border-2 border-dashed border-purple-600 bg-purple-900/20 p-8">
              <p className="text-2xl leading-relaxed text-center md:text-3xl">
                <PresentMathText text={plan.extend?.challenge_ar ?? ''} />
              </p>
            </div>
          </div>
        </div>
      ),
    });
  }

  return slides;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PresentationView({
  lesson,
  plan,
  periodNumber,
  locale,
  lessonId,
}: PresentationViewProps) {
  const planData = plan as unknown as LessonPlanData;
  const slides = useMemo(
    () => buildSlides(planData, lesson, periodNumber),
    [planData, lesson, periodNumber],
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleExit = useCallback(() => {
    window.location.href = `/${locale}/dashboard/lessons/${lessonId}/prepare`;
  }, [locale, lessonId]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowLeft':
          // In RTL, left arrow goes forward
          goNext();
          break;
        case 'ArrowRight':
          // In RTL, right arrow goes backward
          goPrev();
          break;
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goPrev();
          break;
        case 'Escape':
          handleExit();
          break;
        case 'Home':
          setCurrentSlide(0);
          break;
        case 'End':
          setCurrentSlide(slides.length - 1);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, handleExit, slides.length]);

  const slide = slides[currentSlide];
  if (!slide) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white select-none"
      style={{ height: '100vh', overflow: 'hidden' }}
    >
      {/* Top bar: exit button + slide counter */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0">
        <button
          onClick={handleExit}
          className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/20 hover:text-white"
          aria-label="الخروج من العرض التقديمي"
        >
          <X className="size-4" />
          <span>خروج</span>
        </button>

        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span>{lesson.titleAr}</span>
          <span className="text-zinc-600">|</span>
          <span>الحصة {periodNumber}</span>
        </div>

        <div className="rounded-lg bg-white/10 px-4 py-2 text-sm text-zinc-300">
          شريحة {currentSlide + 1} من {slides.length}
        </div>
      </div>

      {/* Slide content area */}
      <div className="flex-1 min-h-0 px-8 py-4 md:px-16 lg:px-24">
        {slide.render()}
      </div>

      {/* Bottom navigation bar */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0">
        {/* Previous button (on the right in RTL) */}
        <button
          onClick={goNext}
          disabled={currentSlide >= slides.length - 1}
          className={cn(
            'flex items-center gap-2 rounded-lg px-6 py-3 text-lg font-medium transition-colors',
            currentSlide >= slides.length - 1
              ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20',
          )}
          aria-label="الشريحة التالية"
        >
          <ChevronLeft className="size-5" />
          <span>التالي</span>
        </button>

        {/* Slide dots / progress */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60vw] px-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                'shrink-0 rounded-full transition-all',
                i === currentSlide
                  ? 'size-3 bg-white'
                  : 'size-2 bg-white/30 hover:bg-white/50',
              )}
              aria-label={`الانتقال إلى شريحة ${i + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Next button (on the left in RTL) */}
        <button
          onClick={goPrev}
          disabled={currentSlide <= 0}
          className={cn(
            'flex items-center gap-2 rounded-lg px-6 py-3 text-lg font-medium transition-colors',
            currentSlide <= 0
              ? 'bg-white/5 text-zinc-600 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20',
          )}
          aria-label="الشريحة السابقة"
        >
          <span>السابق</span>
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
