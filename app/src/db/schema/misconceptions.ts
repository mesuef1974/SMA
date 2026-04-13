import { relations } from 'drizzle-orm';
import {
  boolean,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { lessons } from './curriculum';
import { users } from './users';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const severityEnum = pgEnum('severity', ['low', 'medium', 'high']);

export const detectionSourceEnum = pgEnum('detection_source', [
  'ai_chat',
  'assessment',
  'teacher_manual',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const misconceptionTypes = pgTable('misconception_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  name: text('name').notNull(),
  nameAr: text('name_ar').notNull(),
  description: text('description'),
  descriptionAr: text('description_ar'),
  category: text('category'),
  severity: severityEnum('severity'),
  remediationHint: text('remediation_hint'),
  remediationHintAr: text('remediation_hint_ar'),
});

export const studentMisconceptions = pgTable('student_misconceptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => users.id),
  misconceptionTypeId: uuid('misconception_type_id').references(() => misconceptionTypes.id),
  lessonId: uuid('lesson_id').references(() => lessons.id),
  detectedAt: timestamp('detected_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  detectionSource: detectionSourceEnum('detection_source'),
  confidence: real('confidence'),
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'date' }),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const misconceptionTypesRelations = relations(misconceptionTypes, ({ many }) => ({
  studentMisconceptions: many(studentMisconceptions),
}));

export const studentMisconceptionsRelations = relations(studentMisconceptions, ({ one }) => ({
  student: one(users, {
    fields: [studentMisconceptions.studentId],
    references: [users.id],
  }),
  misconceptionType: one(misconceptionTypes, {
    fields: [studentMisconceptions.misconceptionTypeId],
    references: [misconceptionTypes.id],
  }),
  lesson: one(lessons, {
    fields: [studentMisconceptions.lessonId],
    references: [lessons.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type MisconceptionType = typeof misconceptionTypes.$inferSelect;
export type NewMisconceptionType = typeof misconceptionTypes.$inferInsert;
export type StudentMisconception = typeof studentMisconceptions.$inferSelect;
export type NewStudentMisconception = typeof studentMisconceptions.$inferInsert;
