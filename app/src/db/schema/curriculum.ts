import { relations } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const trackEnum = pgEnum('track', ['literary', 'scientific']);

export const bloomLevelEnum = pgEnum('bloom_level', [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameAr: text('name_ar').notNull(),
  code: text('code').unique(),
});

export const gradeLevels = pgTable(
  'grade_levels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    grade: smallint('grade').notNull(),
    track: trackEnum('track').notNull(),
    subjectId: uuid('subject_id').references(() => subjects.id),
    academicYear: text('academic_year'),
  },
  (table) => [
    uniqueIndex('grade_levels_grade_track_subject_year_unique_idx').on(
      table.grade,
      table.track,
      table.subjectId,
      table.academicYear,
    ),
  ],
);

export const chapters = pgTable(
  'chapters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gradeLevelId: uuid('grade_level_id').references(() => gradeLevels.id),
    number: smallint('number').notNull(),
    title: text('title').notNull(),
    titleAr: text('title_ar').notNull(),
    semester: smallint('semester'),
    sortOrder: smallint('sort_order'),
  },
  (table) => [
    uniqueIndex('chapters_grade_level_number_unique_idx').on(
      table.gradeLevelId,
      table.number,
    ),
  ],
);

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chapterId: uuid('chapter_id').references(() => chapters.id),
    number: text('number').notNull(),
    title: text('title').notNull(),
    titleAr: text('title_ar').notNull(),
    pageStartTe: smallint('page_start_te'),
    pageEndTe: smallint('page_end_te'),
    pageStartSe: smallint('page_start_se'),
    pageEndSe: smallint('page_end_se'),
    periodCount: smallint('period_count').default(2),
    sortOrder: smallint('sort_order'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  },
  (table) => [
    uniqueIndex('lessons_chapter_number_unique_idx').on(table.chapterId, table.number),
  ],
);

export const learningOutcomes = pgTable(
  'learning_outcomes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id').references(() => lessons.id),
    code: text('code'),
    description: text('description').notNull(),
    descriptionAr: text('description_ar').notNull(),
    bloomLevel: bloomLevelEnum('bloom_level'),
    qncfStandard: text('qncf_standard'),
    sortOrder: smallint('sort_order'),
  },
  (table) => [
    uniqueIndex('learning_outcomes_lesson_code_unique_idx').on(
      table.lessonId,
      table.code,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const subjectsRelations = relations(subjects, ({ many }) => ({
  gradeLevels: many(gradeLevels),
}));

export const gradeLevelsRelations = relations(gradeLevels, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [gradeLevels.subjectId],
    references: [subjects.id],
  }),
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  gradeLevel: one(gradeLevels, {
    fields: [chapters.gradeLevelId],
    references: [gradeLevels.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [lessons.chapterId],
    references: [chapters.id],
  }),
  learningOutcomes: many(learningOutcomes),
}));

export const learningOutcomesRelations = relations(learningOutcomes, ({ one }) => ({
  lesson: one(lessons, {
    fields: [learningOutcomes.lessonId],
    references: [lessons.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type GradeLevel = typeof gradeLevels.$inferSelect;
export type NewGradeLevel = typeof gradeLevels.$inferInsert;
export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type LearningOutcome = typeof learningOutcomes.$inferSelect;
export type NewLearningOutcome = typeof learningOutcomes.$inferInsert;
