/**
 * Lesson Plan Zod Schema — v3 (Wave 1 + partial Wave 2)
 *
 * Defines the 8-section lesson preparation structure for Qatar Grade 11
 * Literary-track mathematics, aligned with the 5E instructional model.
 *
 * Wave 1/2 additions (decisions D-27..D-34):
 *   - D-27: 85/15 split — teacher_minutes + student_minutes per section
 *   - D-28: enforced via numeral-filter.ts (post-generation)
 *   - D-29: qatar_context enum on warm_up/explore (and tier=meeting practice)
 *   - D-32: qncf_code on outcomes/items + per-section
 *   - D-33: teacher_guide_page on every section + per-item
 *   - D-34: gate_results root-level field (post-generation only)
 *
 * Constraint (DEC-SMA-020): Claude Structured Output API rejects
 * `z.number().int()` and array `.min/.max`. We use `.refine(Number.isInteger)`
 * and validate array bounds in Zod post-generation only.
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

/** Qatar local context tags (D-29) */
export const qatarContextSchema = z.enum([
  'souq_waqif',
  'corniche_doha',
  'metro_doha',
  'katara',
  'lusail_stadium',
  'aspire_tower',
  'pearl_qatar',
  'education_city',
  'msheireb',
  'sealine',
  'al_shahaniya_school',
  'other_documented',
]);

export type QatarContext = z.infer<typeof qatarContextSchema>;

// ---------------------------------------------------------------------------
// Reusable validators (DEC-SMA-020 compliant)
// ---------------------------------------------------------------------------

/** Integer 0..45 — used for teacher_minutes / student_minutes */
const minutesSchema = z
  .number()
  .min(0)
  .max(45)
  .refine((n) => Number.isInteger(n), {
    message: 'القيمة يجب أن تكون عدداً صحيحاً',
  });

/** Integer 1..229 — teacher guide page (D-33) */
const teacherGuidePageSchema = z
  .number()
  .min(1)
  .max(229, 'صفحة خارج نطاق الدليل')
  .refine((n) => Number.isInteger(n), {
    message: 'رقم الصفحة يجب أن يكون عدداً صحيحاً',
  });

/** QNCF code (D-32) — e.g. QNCF-G11-M-STA-001 */
const qncfCodeSchema = z
  .string()
  .regex(/^QNCF-G11-M-[A-Z]{3}-\d{3}$/, 'كود QNCF غير صالح');

// ---------------------------------------------------------------------------
// Section 1: Header
// ---------------------------------------------------------------------------

export const headerSchema = z.object({
  lesson_title_ar: z.string().min(1),
  lesson_title_en: z.string().optional(),
  unit_number: z.number(),
  period: z.enum(['1', '2']),
  date: z.string().optional(),
  teacher_guide_pages: z.string(),
  student_book_pages: z.string(),
});

export type Header = z.infer<typeof headerSchema>;

// ---------------------------------------------------------------------------
// Section 2: Learning Outcomes
// ---------------------------------------------------------------------------

export const learningOutcomeItemSchema = z.object({
  outcome_ar: z.string().min(1),
  bloom_level: bloomLevelSchema,
  action_verb_ar: z.string(),
  qncf_code: qncfCodeSchema, // D-32
});

// NOTE: array bounds enforced post-generation (DEC-SMA-020).
export const learningOutcomesSchema = z.array(learningOutcomeItemSchema);

export type LearningOutcomeItem = z.infer<typeof learningOutcomeItemSchema>;

// ---------------------------------------------------------------------------
// Section 3: Warm-Up (Engage)
// ---------------------------------------------------------------------------

export const warmUpSchema = z.object({
  // duration_minutes is computed = teacher_minutes + student_minutes (D-27)
  teacher_minutes: minutesSchema,
  student_minutes: minutesSchema,
  activity_ar: z.string().min(1),
  qncf_code: qncfCodeSchema, // D-32 (section level)
  teacher_guide_page: teacherGuidePageSchema, // D-33
  qatar_context: qatarContextSchema, // D-29 (required on warm_up)
});

export type WarmUp = z.infer<typeof warmUpSchema>;

// ---------------------------------------------------------------------------
// Section 4: Explore
// ---------------------------------------------------------------------------

export const differentiationSchema = z.object({
  approaching: z.string(),
  meeting: z.string(),
  exceeding: z.string(),
});

export const exploreSchema = z.object({
  teacher_minutes: minutesSchema,
  student_minutes: minutesSchema,
  activity_ar: z.string().min(1),
  guiding_questions: z.array(z.string()),
  differentiation: differentiationSchema,
  qncf_code: qncfCodeSchema, // D-32
  teacher_guide_page: teacherGuidePageSchema, // D-33
  qatar_context: qatarContextSchema, // D-29 (required on explore)
});

export type Explore = z.infer<typeof exploreSchema>;

// ---------------------------------------------------------------------------
// Section 5: Explain
// ---------------------------------------------------------------------------

export const explainSchema = z.object({
  teacher_minutes: minutesSchema,
  student_minutes: minutesSchema,
  concept_ar: z.string().min(1),
  key_vocabulary: z.array(z.string()),
  formulas: z.array(z.string()).optional(),
  worked_examples: z.array(z.string()),
  misconception_alerts: z.array(z.string()),
  qncf_code: qncfCodeSchema, // D-32
  teacher_guide_page: teacherGuidePageSchema, // D-33
});

export type Explain = z.infer<typeof explainSchema>;

// ---------------------------------------------------------------------------
// Section 6: Practice (Elaborate)
// ---------------------------------------------------------------------------

export const practiceItemSchema = z.object({
  question_ar: z.string().min(1),
  bloom_level: bloomLevelSchema,
  tier: tierSchema,
  expected_answer: z.string(),
  source_page: z.string().optional(),
  qncf_code: qncfCodeSchema, // D-32 (per item)
  teacher_guide_page: teacherGuidePageSchema, // D-33 (per item)
  qatar_context: qatarContextSchema.optional(), // D-29 (optional, intended for tier='meeting')
});

export const practiceSchema = z.object({
  teacher_minutes: minutesSchema,
  student_minutes: minutesSchema,
  items: z.array(practiceItemSchema).min(1),
  teacher_guide_page: teacherGuidePageSchema, // D-33 (section level)
  // No section-level qncf_code on practice per spec (items carry their own).
});

export type PracticeItem = z.infer<typeof practiceItemSchema>;
export type Practice = z.infer<typeof practiceSchema>;

// ---------------------------------------------------------------------------
// Section 7: Assess (Formative Assessment / Evaluate)
// ---------------------------------------------------------------------------

export const assessItemSchema = z.object({
  question_ar: z.string().min(1),
  type: questionTypeSchema,
  model_answer_ar: z.string(),
  bloom_level: bloomLevelSchema,
  qncf_code: qncfCodeSchema, // D-32 (per item)
  teacher_guide_page: teacherGuidePageSchema, // D-33 (per item)
});

export const assessSchema = z.object({
  teacher_minutes: minutesSchema,
  student_minutes: minutesSchema,
  items: z.array(assessItemSchema).min(1),
  teacher_guide_page: teacherGuidePageSchema, // D-33 (section level)
});

export type AssessItem = z.infer<typeof assessItemSchema>;
export type Assess = z.infer<typeof assessSchema>;

// ---------------------------------------------------------------------------
// Section 8: Extend (Optional Enrichment)
// ---------------------------------------------------------------------------

export const extendSchema = z.object({
  teacher_minutes: minutesSchema,
  student_minutes: minutesSchema,
  challenge_ar: z.string().min(1),
  is_optional: z.boolean().default(true),
  excluded_from_assessments: z.boolean().default(true),
  qncf_code: qncfCodeSchema, // D-32 (section level)
  teacher_guide_page: teacherGuidePageSchema, // D-33
});

export type Extend = z.infer<typeof extendSchema>;

// ---------------------------------------------------------------------------
// D-34: Triple-Gate results (post-generation, never sent to LLM)
// ---------------------------------------------------------------------------

export const gateResultsSchema = z.object({
  bloom_gate: z.enum(['pass', 'fail']),
  qncf_gate: z.enum(['pass', 'fail']),
  advisor_gate: z.enum(['pending', 'approved', 'needs_revision']),
  failure_reasons: z.array(z.string()).default([]),
});

export type GateResults = z.infer<typeof gateResultsSchema>;

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
  gate_results: gateResultsSchema.optional(), // D-34 — added post-generation
});

export type LessonPlanData = z.infer<typeof lessonPlanSchema>;

// ---------------------------------------------------------------------------
// Computed helpers
// ---------------------------------------------------------------------------

/** D-27: total section duration = teacher_minutes + student_minutes */
export function sectionDurationMinutes(section: {
  teacher_minutes: number;
  student_minutes: number;
}): number {
  return section.teacher_minutes + section.student_minutes;
}
