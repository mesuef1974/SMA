'use client';

/**
 * LessonPlanViewer — displays the 8-section lesson plan in a rich, RTL-first layout.
 *
 * Sections:
 *   1. Header          — lesson metadata card
 *   2. Learning Outcomes — outcomes list with Bloom badges
 *   3. Warm-Up         — warm-up activity card
 *   4. Explore         — exploration with differentiation tabs
 *   5. Explain         — instruction, vocabulary, formulas (KaTeX), worked examples, alerts
 *   6. Practice        — exercises with Bloom + Tier badges
 *   7. Assess          — assessment questions with model answers
 *   8. Extend          — optional enrichment (distinct border)
 */

import type {
  LessonPlanData,
  BloomLevel,
  Tier,
  LearningOutcomeItem,
  PracticeItem,
  AssessItem,
} from '@/lib/lesson-plans/schema';
// Note: Metadata section removed in schema v2 (optional parameter count reduction)
import { MathDisplay, MathText } from '@/components/math/math-display';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Target,
  Lightbulb,
  Compass,
  GraduationCap,
  PenTool,
  ClipboardCheck,
  Rocket,
  Clock,
  AlertTriangle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Bloom color mapping
// ---------------------------------------------------------------------------

const bloomColors: Record<BloomLevel, string> = {
  remember: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  understand: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  apply: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  analyze: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  evaluate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  create: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

const bloomLabels: Record<BloomLevel, string> = {
  remember: 'تذكّر',
  understand: 'فهم',
  apply: 'تطبيق',
  analyze: 'تحليل',
  evaluate: 'تقويم',
  create: 'إبداع',
};

const tierLabels: Record<Tier, string> = {
  approaching: 'دون المستوى',
  meeting: 'ضمن المستوى',
  exceeding: 'فوق المستوى',
};

const tierColors: Record<Tier, string> = {
  approaching: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  meeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  exceeding: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function BloomBadge({ level }: { level: BloomLevel }) {
  return (
    <Badge className={cn('shrink-0', bloomColors[level])}>
      {bloomLabels[level]}
    </Badge>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <Badge className={cn('shrink-0', tierColors[tier])}>
      {tierLabels[tier]}
    </Badge>
  );
}

function DurationBadge({ minutes }: { minutes: number }) {
  return (
    <Badge variant="outline" className="gap-1 shrink-0">
      <Clock className="size-3" />
      {minutes} د
    </Badge>
  );
}

function SectionCard({
  icon: Icon,
  title,
  duration,
  accent,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  duration?: number;
  accent?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(accent, className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-5 shrink-0" />
          <span className="flex-1">{title}</span>
          {duration != null && <DurationBadge minutes={duration} />}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Header
// ---------------------------------------------------------------------------

function HeaderSection({ data }: { data: LessonPlanData }) {
  const h = data.header;
  return (
    <SectionCard icon={BookOpen} title="معلومات الدرس">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">عنوان الدرس:</span>{' '}
          <span className="font-medium">{h.lesson_title_ar}</span>
        </div>
        {h.lesson_title_en && (
          <div dir="ltr" className="text-start">
            <span className="text-muted-foreground">Title:</span>{' '}
            <span className="font-medium">{h.lesson_title_en}</span>
          </div>
        )}
        {h.unit_number != null && (
          <div>
            <span className="text-muted-foreground">الوحدة:</span>{' '}
            <span className="font-medium">{h.unit_number}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">الحصة:</span>{' '}
          <span className="font-medium">{h.period}</span>
        </div>
        {h.date && (
          <div>
            <span className="text-muted-foreground">التاريخ:</span>{' '}
            <span className="font-medium">{h.date}</span>
          </div>
        )}
        {h.teacher_guide_pages && (
          <div>
            <span className="text-muted-foreground">دليل المعلم:</span>{' '}
            <span className="font-medium">ص {h.teacher_guide_pages}</span>
          </div>
        )}
        {h.student_book_pages && (
          <div>
            <span className="text-muted-foreground">كتاب الطالب:</span>{' '}
            <span className="font-medium">ص {h.student_book_pages}</span>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Learning Outcomes
// ---------------------------------------------------------------------------

function LearningOutcomesSection({ outcomes }: { outcomes: LearningOutcomeItem[] }) {
  return (
    <SectionCard icon={Target} title="مخرجات التعلم">
      <ul className="space-y-3">
        {outcomes.map((outcome, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {i + 1}
            </span>
            <div className="flex-1 space-y-1">
              <p className="text-sm">{outcome.outcome_ar}</p>
              <div className="flex flex-wrap gap-1.5">
                <BloomBadge level={outcome.bloom_level} />
                {outcome.action_verb_ar && (
                  <Badge variant="outline" className="text-xs">
                    {outcome.action_verb_ar}
                  </Badge>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Warm-Up
// ---------------------------------------------------------------------------

function WarmUpSection({ data }: { data: LessonPlanData['warm_up'] }) {
  return (
    <SectionCard
      icon={Lightbulb}
      title="التهيئة"
      duration={data.duration_minutes}
    >
      <div className="space-y-3">
        <p className="text-sm leading-relaxed">{data.activity_ar}</p>
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 4: Explore
// ---------------------------------------------------------------------------

function ExploreSection({ data }: { data: LessonPlanData['explore'] }) {
  const hasDifferentiation =
    data.differentiation &&
    (data.differentiation.approaching ||
      data.differentiation.meeting ||
      data.differentiation.exceeding);

  return (
    <SectionCard
      icon={Compass}
      title="الاستكشاف"
      duration={data.duration_minutes}
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">{data.activity_ar}</p>

        {data.guiding_questions && data.guiding_questions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">أسئلة موجّهة:</p>
            <ul className="space-y-1.5">
              {data.guiding_questions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-muted-foreground text-xs">•</span>
                  <MathText text={q} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasDifferentiation && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">التمايز:</p>
            <Tabs defaultValue="meeting">
              <TabsList>
                {data.differentiation!.approaching && (
                  <TabsTrigger value="approaching">دون المستوى</TabsTrigger>
                )}
                {data.differentiation!.meeting && (
                  <TabsTrigger value="meeting">ضمن المستوى</TabsTrigger>
                )}
                {data.differentiation!.exceeding && (
                  <TabsTrigger value="exceeding">فوق المستوى</TabsTrigger>
                )}
              </TabsList>

              {data.differentiation!.approaching && (
                <TabsContent value="approaching" className="mt-3">
                  <p className="text-sm leading-relaxed rounded-lg bg-red-50 dark:bg-red-950/20 p-3">
                    <MathText text={data.differentiation!.approaching} />
                  </p>
                </TabsContent>
              )}
              {data.differentiation!.meeting && (
                <TabsContent value="meeting" className="mt-3">
                  <p className="text-sm leading-relaxed rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
                    <MathText text={data.differentiation!.meeting} />
                  </p>
                </TabsContent>
              )}
              {data.differentiation!.exceeding && (
                <TabsContent value="exceeding" className="mt-3">
                  <p className="text-sm leading-relaxed rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
                    <MathText text={data.differentiation!.exceeding} />
                  </p>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 5: Explain
// ---------------------------------------------------------------------------

function ExplainSection({ data }: { data: LessonPlanData['explain'] }) {
  return (
    <SectionCard
      icon={GraduationCap}
      title="الشرح"
      duration={data.duration_minutes}
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed">{data.concept_ar}</p>

        {/* Key Vocabulary */}
        {data.key_vocabulary && data.key_vocabulary.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">المفردات الرياضية:</p>
            <div className="flex flex-wrap gap-1.5">
              {data.key_vocabulary.map((word, i) => (
                <Badge key={i} variant="secondary">
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Formulas */}
        {data.formulas && data.formulas.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">القوانين:</p>
            <div className="space-y-2">
              {data.formulas.map((formula, i) => {
                // Check if the formula contains LaTeX-like content
                const hasLatex = /[\\^_{}]/.test(formula) || /\$/.test(formula);
                if (hasLatex) {
                  // Strip surrounding $ or $$ if present
                  const cleaned = formula.replace(/^\$\$?|\$\$?$/g, '').trim();
                  return (
                    <div
                      key={i}
                      className="rounded-lg bg-muted/50 p-3 text-center"
                    >
                      <MathDisplay latex={cleaned} display />
                    </div>
                  );
                }
                return (
                  <div
                    key={i}
                    className="rounded-lg bg-muted/50 p-3 text-sm text-center"
                  >
                    <MathText text={formula} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Worked Examples */}
        {data.worked_examples && data.worked_examples.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">أمثلة محلولة:</p>
            <div className="space-y-2">
              {data.worked_examples.map((example, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-3 text-sm leading-relaxed"
                >
                  <span className="font-medium text-primary me-1">مثال {i + 1}:</span>
                  <MathText text={example} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Misconception Alerts */}
        {data.misconception_alerts && data.misconception_alerts.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">تنبيهات الأخطاء المفاهيمية:</p>
            <div className="space-y-2">
              {data.misconception_alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-3 text-sm"
                >
                  <AlertTriangle className="size-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                  <MathText text={alert} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 6: Practice
// ---------------------------------------------------------------------------

function PracticeSection({ data }: { data: LessonPlanData['practice'] }) {
  return (
    <SectionCard
      icon={PenTool}
      title="التمارين"
      duration={data.duration_minutes}
    >
      <div className="space-y-3">
        {data.items.map((item: PracticeItem, i: number) => (
          <div
            key={i}
            className="rounded-lg border border-border p-3 space-y-2"
          >
            <div className="flex items-start gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm flex-1 leading-relaxed">
                <MathText text={item.question_ar} />
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 ms-8">
              {item.bloom_level && <BloomBadge level={item.bloom_level} />}
              {item.tier && <TierBadge tier={item.tier} />}
              {item.source_page && (
                <Badge variant="outline" className="text-xs">
                  ص {item.source_page}
                </Badge>
              )}
            </div>

            {item.expected_answer && (
              <div className="ms-8 mt-1 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                <span className="font-medium">الإجابة المتوقعة: </span>
                <MathText text={item.expected_answer} />
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 7: Assess
// ---------------------------------------------------------------------------

const questionTypeLabels: Record<string, string> = {
  mcq: 'اختيار من متعدد',
  short_answer: 'إجابة قصيرة',
  problem_solving: 'حل مسائل',
};

function AssessSection({ data }: { data: LessonPlanData['assess'] }) {
  return (
    <SectionCard
      icon={ClipboardCheck}
      title="التقويم"
      duration={data.duration_minutes}
    >
      <div className="space-y-3">
        {data.items.map((item: AssessItem, i: number) => (
          <div
            key={i}
            className="rounded-lg border border-border p-3 space-y-2"
          >
            <div className="flex items-start gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm flex-1 leading-relaxed">
                <MathText text={item.question_ar} />
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 ms-8">
              {item.type && (
                <Badge variant="outline" className="text-xs">
                  {questionTypeLabels[item.type] ?? item.type}
                </Badge>
              )}
              {item.bloom_level && <BloomBadge level={item.bloom_level} />}
            </div>

            {item.model_answer_ar && (
              <div className="ms-8 mt-1 rounded-md bg-green-50 dark:bg-green-950/20 p-2 text-xs">
                <span className="font-medium text-green-700 dark:text-green-400">الإجابة النموذجية: </span>
                <MathText text={item.model_answer_ar} />
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section 8: Extend (Optional)
// ---------------------------------------------------------------------------

function ExtendSection({ data }: { data: NonNullable<LessonPlanData['extend']> }) {
  return (
    <Card className="border-2 border-dashed border-purple-300 dark:border-purple-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="size-5 shrink-0 text-purple-600 dark:text-purple-400" />
          <span className="flex-1">الإثراء</span>
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            اختياري
          </Badge>
          <DurationBadge minutes={data.duration_minutes} />
        </CardTitle>
        <CardDescription>نشاط إثرائي اختياري لا يُقيّم ضمن الدرجات</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">
          <MathText text={data.challenge_ar} />
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface LessonPlanViewerProps {
  /** The validated lesson plan data (all 9 sections). */
  plan: LessonPlanData;
  /** Optional CSS class for the root container. */
  className?: string;
}

/**
 * Renders a complete lesson plan in 9 sections with RTL-first, dark-mode-ready
 * layout using shadcn/ui components and KaTeX for math expressions.
 */
export function LessonPlanViewer({ plan, className }: LessonPlanViewerProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* 1. Header */}
      <HeaderSection data={plan} />

      {/* 2. Learning Outcomes */}
      <LearningOutcomesSection outcomes={plan.learning_outcomes} />

      {/* 3. Warm-Up */}
      <WarmUpSection data={plan.warm_up} />

      {/* 4. Explore */}
      <ExploreSection data={plan.explore} />

      {/* 5. Explain */}
      <ExplainSection data={plan.explain} />

      {/* 6. Practice */}
      <PracticeSection data={plan.practice} />

      {/* 7. Assess */}
      <AssessSection data={plan.assess} />

      {/* 8. Extend (optional) */}
      {plan.extend && <ExtendSection data={plan.extend} />}
    </div>
  );
}
