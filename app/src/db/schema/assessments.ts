import { relations } from 'drizzle-orm';
import {
  boolean,
  pgEnum,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { bloomLevelEnum, lessons } from './curriculum';
import { users } from './users';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const assessmentTypeEnum = pgEnum('assessment_type', [
  'formative',
  'summative',
  'diagnostic',
]);

export const questionTypeEnum = pgEnum('question_type', [
  'multiple_choice',
  'short_answer',
  'essay',
  'math_input',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').references(() => lessons.id),
  teacherId: uuid('teacher_id').references(() => users.id),
  title: text('title').notNull(),
  titleAr: text('title_ar').notNull(),
  type: assessmentTypeEnum('type'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const assessmentQuestions = pgTable('assessment_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentId: uuid('assessment_id').references(() => assessments.id),
  questionText: text('question_text').notNull(),
  questionTextAr: text('question_text_ar').notNull(),
  questionType: questionTypeEnum('question_type'),
  correctAnswer: text('correct_answer'),
  bloomLevel: bloomLevelEnum('bloom_level'),
  points: smallint('points').default(1),
  sortOrder: smallint('sort_order'),
});

export const studentResponses = pgTable('student_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentQuestionId: uuid('assessment_question_id').references(() => assessmentQuestions.id),
  studentId: uuid('student_id').references(() => users.id),
  response: text('response'),
  isCorrect: boolean('is_correct'),
  score: real('score'),
  aiFeedback: text('ai_feedback'),
  aiFeedbackAr: text('ai_feedback_ar'),
  submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [assessments.lessonId],
    references: [lessons.id],
  }),
  teacher: one(users, {
    fields: [assessments.teacherId],
    references: [users.id],
  }),
  questions: many(assessmentQuestions),
}));

export const assessmentQuestionsRelations = relations(assessmentQuestions, ({ one, many }) => ({
  assessment: one(assessments, {
    fields: [assessmentQuestions.assessmentId],
    references: [assessments.id],
  }),
  studentResponses: many(studentResponses),
}));

export const studentResponsesRelations = relations(studentResponses, ({ one }) => ({
  assessmentQuestion: one(assessmentQuestions, {
    fields: [studentResponses.assessmentQuestionId],
    references: [assessmentQuestions.id],
  }),
  student: one(users, {
    fields: [studentResponses.studentId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type NewAssessmentQuestion = typeof assessmentQuestions.$inferInsert;
export type StudentResponse = typeof studentResponses.$inferSelect;
export type NewStudentResponse = typeof studentResponses.$inferInsert;
