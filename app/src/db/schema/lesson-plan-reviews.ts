/**
 * P1.3 (2026-04-21) — Review history log (DEC-SMA-037 follow-up)
 *
 * Audit trail for every advisor decision on a lesson plan. Each row captures
 * a single decision (approve / reject / request changes) with optional
 * rubric scores (jsonb, populated by the P1.2 rubric form when available)
 * and free-text comment. Decisions are append-only.
 */

import { relations } from 'drizzle-orm';
import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { lessonPlans } from './lesson-plans';
import { users } from './users';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const reviewDecisionEnum = pgEnum('lesson_plan_review_decision', [
  'approved',
  'rejected',
  'changes_requested',
]);

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const lessonPlanReviews = pgTable('lesson_plan_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonPlanId: uuid('lesson_plan_id')
    .notNull()
    .references(() => lessonPlans.id, { onDelete: 'cascade' }),
  reviewerId: uuid('reviewer_id')
    .notNull()
    .references(() => users.id),
  decision: reviewDecisionEnum('decision').notNull(),
  comment: text('comment'),
  // Nullable for forward compatibility with P1.2 rubric form — once that
  // lands, each review row will carry a structured {criterion: score} map.
  rubricScores: jsonb('rubric_scores'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  // BL-026 — per-teacher read state. NULL = unread (surfaces in the bell
  // dropdown); populated with the moment the teacher acknowledged the
  // review (opened the plan or dismissed from the dropdown).
  readByTeacherAt: timestamp('read_by_teacher_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const lessonPlanReviewsRelations = relations(
  lessonPlanReviews,
  ({ one }) => ({
    lessonPlan: one(lessonPlans, {
      fields: [lessonPlanReviews.lessonPlanId],
      references: [lessonPlans.id],
    }),
    reviewer: one(users, {
      fields: [lessonPlanReviews.reviewerId],
      references: [users.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type LessonPlanReview = typeof lessonPlanReviews.$inferSelect;
export type NewLessonPlanReview = typeof lessonPlanReviews.$inferInsert;
