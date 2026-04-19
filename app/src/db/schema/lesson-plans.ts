import { relations } from 'drizzle-orm';
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { lessons } from './curriculum';
import { users } from './users';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const lessonPlanStatusEnum = pgEnum('lesson_plan_status', [
  'draft',
  'in_review',
  'approved',
  'archived',
  // DEC-SMA-045 (2026-04-19): explicit terminal state for plans that
  // fail Triple-Gate or source traceability validation at generation time.
  // Prior behaviour silently persisted these as 'draft'.
  'rejected_gate',
]);

export const lessonPlanSectionEnum = pgEnum('lesson_plan_section', [
  'warm_up',
  'review',
  'introduction',
  'exploration',
  'practice',
  'assessment',
  'differentiation',
  'closure',
  'homework',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const lessonPlans = pgTable('lesson_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').references(() => lessons.id),
  teacherId: uuid('teacher_id').references(() => users.id),
  status: lessonPlanStatusEnum('status').default('draft'),
  periodNumber: smallint('period_number'),
  sectionData: jsonb('section_data'),
  aiSuggestions: jsonb('ai_suggestions'),
  teacherNotes: text('teacher_notes'),
  humanReviewed: boolean('human_reviewed').default(false),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const lessonPlansRelations = relations(lessonPlans, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonPlans.lessonId],
    references: [lessons.id],
  }),
  teacher: one(users, {
    fields: [lessonPlans.teacherId],
    references: [users.id],
    relationName: 'lessonPlanTeacher',
  }),
  reviewer: one(users, {
    fields: [lessonPlans.reviewedBy],
    references: [users.id],
    relationName: 'lessonPlanReviewer',
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type LessonPlan = typeof lessonPlans.$inferSelect;
export type NewLessonPlan = typeof lessonPlans.$inferInsert;
