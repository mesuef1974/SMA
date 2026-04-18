/**
 * Lesson Plan Zod Schema — v2
 *
 * Defines the 8-section lesson preparation structure for Qatar Grade 11
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
 *
 * Design philosophy: v2 reduces optional parameters to ≤24 to satisfy
 * Claude Structured Output API constraints (limit: 24 optional parameters).
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
  lesson_title_en: z.string().optional(),           // optional — kept
  unit_number: z.number(),                          // required (was optional)
  period: z.enum(['1', '2']),
  date: z.string().optional(),                      // optional — kept
  teacher_guide_pages: z.string(),                  // required (was optional)
  student_book_pages: z.string(),                   // required (was optional)
});

export type Header = z.infer<typeof headerSchema>;

// ---------------------------------------------------------------------------
// Section 2: Learning Outcomes
// ---------------------------------------------------------------------------

export const learningOutcomeItemSchema = z.object({
  outcome_ar: z.string().min(1),
  bloom_level: bloomLevelSchema,
  action_verb_ar: z.string(),                       // required (was optional)
});

// NOTE: .min(2).max(4) removed — Claude Structured Output API rejects
// minItems > 1 in JSON Schema. Validation is enforced by Zod post-generation.
export const learningOutcomesSchema = z.array(learningOutcomeItemSchema);

export type LearningOutcomeItem = z.infer<typeof learningOutcomeItemSchema>;

// ---------------------------------------------------------------------------
// Section 3: Warm-Up (Engage)
// ---------------------------------------------------------------------------

export const warmUpSchema = z.object({
  duration_minutes: z.number().default(5),          // default — kept
  activity_ar: z.string().min(1),
  // prerequisite_concepts and target_bloom removed entirely
});

export type WarmUp = z.infer<typeof warmUpSchema>;

// ---------------------------------------------------------------------------
// Section 4: Explore
// ---------------------------------------------------------------------------

export const differentiationSchema = z.object({
  approaching: z.string(),                          // required (was optional)
  meeting: z.string(),                              // required (was optional)
  exceeding: z.string(),                            // required (was optional)
});

export const exploreSchema = z.object({
  duration_minutes: z.number().default(15),         // default — kept
  activity_ar: z.string().min(1),
  guiding_questions: z.array(z.string()),           // required (was optional)
  differentiation: differentiationSchema,           // required (was optional)
});

export type Explore = z.infer<typeof exploreSchema>;

// ---------------------------------------------------------------------------
// Section 5: Explain
// ---------------------------------------------------------------------------

export const explainSchema = z.object({
  duration_minutes: z.number().default(5),          // default — kept
  concept_ar: z.string().min(1),
  key_vocabulary: z.array(z.string()),              // required (was optional)
  formulas: z.array(z.string()).optional(),          // optional — kept
  worked_examples: z.array(z.string()),             // required (was optional)
  misconception_alerts: z.array(z.string()),        // required (was optional)
});

export type Explain = z.infer<typeof explainSchema>;

// ---------------------------------------------------------------------------
// Section 6: Practice (Elaborate)
// ---------------------------------------------------------------------------

export const practiceItemSchema = z.object({
  question_ar: z.string().min(1),
  bloom_level: bloomLevelSchema,                    // required (was optional)
  tier: tierSchema,                                 // required (was optional)
  expected_answer: z.string(),                      // required (was optional)
  source_page: z.string().optional(),               // optional — kept
});

export const practiceSchema = z.object({
  duration_minutes: z.number().default(12),         // default — kept
  items: z.array(practiceItemSchema).min(1),
});

export type PracticeItem = z.infer<typeof practiceItemSchema>;
export type Practice = z.infer<typeof practiceSchema>;

// ---------------------------------------------------------------------------
// Section 7: Assess (Formative Assessment / Evaluate)
// ---------------------------------------------------------------------------

export const assessItemSchema = z.object({
  question_ar: z.string().min(1),
  type: questionTypeSchema,                         // required (was optional)
  model_answer_ar: z.string(),                      // required (was optional)
  bloom_level: bloomLevelSchema,                    // required (was optional)
});

export const assessSchema = z.object({
  duration_minutes: z.number().default(5),          // default — kept
  items: z.array(assessItemSchema).min(1),
});

export type AssessItem = z.infer<typeof assessItemSchema>;
export type Assess = z.infer<typeof assessSchema>;

// ---------------------------------------------------------------------------
// Section 8: Extend (Optional Enrichment)
// ---------------------------------------------------------------------------

export const extendSchema = z.object({
  duration_minutes: z.number().default(3),          // default — kept
  challenge_ar: z.string().min(1),
  is_optional: z.boolean().default(true),           // default — kept
  excluded_from_assessments: z.boolean().default(true), // default — kept
});

export type Extend = z.infer<typeof extendSchema>;

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
  extend: extendSchema.optional(),                  // optional — kept
  // metadata removed entirely (was Section 9)
});

export type LessonPlanData = z.infer<typeof lessonPlanSchema>;
