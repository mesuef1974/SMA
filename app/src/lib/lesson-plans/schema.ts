/**
 * Lesson Plan Zod Schema — v1
 *
 * Defines the 9-section lesson preparation structure for Qatar Grade 11
 * Literary-track mathematics, aligned with the 5E instructional model.
 *
 * Sections:
 *   1. header          — Lesson metadata
 *   2. learning_outcomes — 2-4 measurable outcomes (Bloom-tagged)
 *   3. warm_up         — Opening activity (Engage)
 *   4. explore         — Exploration activity (Explore)
 *   5. explain         — Direct instruction (Explain)
 *   6. practice        — Guided / independent practice (Elaborate)
 *   7. assess          — Formative assessment (Evaluate)
 *   8. extend          — Optional enrichment
 *   9. metadata        — Generation metadata
 *
 * Design philosophy: v1 is **practical** — fields that AI may not always
 * produce perfectly are marked optional so the teacher can fill them later.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

/** Bloom taxonomy levels (revised Anderson & Krathwohl, 2001) */
export const bloomLevelSchema = z.enum([
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

export type BloomLevel = z.infer<typeof bloomLevelSchema>;

/** Student differentiation tiers */
export const tierSchema = z.enum(['approaching', 'meeting', 'exceeding']);

export type Tier = z.infer<typeof tierSchema>;

/** Assessment question types */
export const questionTypeSchema = z.enum([
  'mcq',
  'short_answer',
  'problem_solving',
]);

export type QuestionType = z.infer<typeof questionTypeSchema>;

// ---------------------------------------------------------------------------
// Section 1: Header
// ---------------------------------------------------------------------------

export const headerSchema = z.object({
  lesson_title_ar: z.string().min(1),
  lesson_title_en: z.string().optional(),
  unit_number: z.number().optional(),
  period: z.enum(['1', '2']),
  date: z.string().optional(),
  teacher_guide_pages: z.string().optional(),
  student_book_pages: z.string().optional(),
});

export type Header = z.infer<typeof headerSchema>;

// ---------------------------------------------------------------------------
// Section 2: Learning Outcomes
// ---------------------------------------------------------------------------

export const learningOutcomeItemSchema = z.object({
  outcome_ar: z.string().min(1),
  bloom_level: bloomLevelSchema,
  action_verb_ar: z.string().optional(),
});

// NOTE: .min(2).max(4) removed — Claude Structured Output API rejects
// minItems > 1 in JSON Schema. Validation is enforced by Zod post-generation.
export const learningOutcomesSchema = z.array(learningOutcomeItemSchema);

export type LearningOutcomeItem = z.infer<typeof learningOutcomeItemSchema>;

// ---------------------------------------------------------------------------
// Section 3: Warm-Up (Engage)
// ---------------------------------------------------------------------------

export const warmUpSchema = z.object({
  duration_minutes: z.number().default(5),
  activity_ar: z.string().min(1),
  prerequisite_concepts: z.array(z.string()).optional(),
  target_bloom: z.enum(['remember', 'understand']).optional(),
});

export type WarmUp = z.infer<typeof warmUpSchema>;

// ---------------------------------------------------------------------------
// Section 4: Explore
// ---------------------------------------------------------------------------

export const differentiationSchema = z.object({
  approaching: z.string().optional(),
  meeting: z.string().optional(),
  exceeding: z.string().optional(),
});

export const exploreSchema = z.object({
  duration_minutes: z.number().default(15),
  activity_ar: z.string().min(1),
  guiding_questions: z.array(z.string()).optional(),
  differentiation: differentiationSchema.optional(),
});

export type Explore = z.infer<typeof exploreSchema>;

// ---------------------------------------------------------------------------
// Section 5: Explain
// ---------------------------------------------------------------------------

export const explainSchema = z.object({
  duration_minutes: z.number().default(5),
  concept_ar: z.string().min(1),
  key_vocabulary: z.array(z.string()).optional(),
  formulas: z.array(z.string()).optional(),
  worked_examples: z.array(z.string()).optional(),
  misconception_alerts: z.array(z.string()).optional(),
});

export type Explain = z.infer<typeof explainSchema>;

// ---------------------------------------------------------------------------
// Section 6: Practice (Elaborate)
// ---------------------------------------------------------------------------

export const practiceItemSchema = z.object({
  question_ar: z.string().min(1),
  bloom_level: bloomLevelSchema.optional(),
  tier: tierSchema.optional(),
  expected_answer: z.string().optional(),
  source_page: z.string().optional(),
});

export const practiceSchema = z.object({
  duration_minutes: z.number().default(12),
  items: z.array(practiceItemSchema).min(1),
});

export type PracticeItem = z.infer<typeof practiceItemSchema>;
export type Practice = z.infer<typeof practiceSchema>;

// ---------------------------------------------------------------------------
// Section 7: Assess (Formative Assessment / Evaluate)
// ---------------------------------------------------------------------------

export const assessItemSchema = z.object({
  question_ar: z.string().min(1),
  type: questionTypeSchema.optional(),
  model_answer_ar: z.string().optional(),
  bloom_level: bloomLevelSchema.optional(),
});

export const assessSchema = z.object({
  duration_minutes: z.number().default(5),
  items: z.array(assessItemSchema).min(1),
});

export type AssessItem = z.infer<typeof assessItemSchema>;
export type Assess = z.infer<typeof assessSchema>;

// ---------------------------------------------------------------------------
// Section 8: Extend (Optional Enrichment)
// ---------------------------------------------------------------------------

export const extendSchema = z.object({
  duration_minutes: z.number().default(3),
  challenge_ar: z.string().min(1),
  is_optional: z.boolean().default(true),
  excluded_from_assessments: z.boolean().default(true),
});

export type Extend = z.infer<typeof extendSchema>;

// ---------------------------------------------------------------------------
// Section 9: Metadata
// ---------------------------------------------------------------------------

export const bloomDistributionSchema = z.record(bloomLevelSchema, z.number()).optional();

export const metadataSchema = z.object({
  generated_at: z.string().optional(),
  generated_by: z.enum(['ai', 'teacher']).default('ai'),
  bloom_distribution: bloomDistributionSchema,
  teacher_guide_pages: z.array(z.string()).optional(),
  student_book_pages: z.array(z.string()).optional(),
});

export type Metadata = z.infer<typeof metadataSchema>;

// ---------------------------------------------------------------------------
// Full Lesson Plan
// ---------------------------------------------------------------------------

export const lessonPlanSchema = z.object({
  header: headerSchema,
  learning_outcomes: learningOutcomesSchema,
  warm_up: warmUpSchema,
  explore: exploreSchema,
  explain: explainSchema,
  practice: practiceSchema,
  assess: assessSchema,
  extend: extendSchema.optional(),
  metadata: metadataSchema.optional(),
});

export type LessonPlanData = z.infer<typeof lessonPlanSchema>;
