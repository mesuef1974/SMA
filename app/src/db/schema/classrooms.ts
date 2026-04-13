import { relations } from 'drizzle-orm';
import {
  boolean,
  char,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from './users';

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/**
 * Classrooms created by teachers.
 * Each classroom has a unique 6-character code that students use to join.
 */
export const classrooms = pgTable('classrooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  nameAr: text('name_ar').notNull(),
  code: char('code', { length: 6 }).unique().notNull(),
  academicYear: text('academic_year').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

/**
 * Students who joined a classroom via the class code.
 * These are anonymous users — no auth account required.
 */
export const classroomStudents = pgTable('classroom_students', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroomId: uuid('classroom_id')
    .notNull()
    .references(() => classrooms.id),
  displayName: text('display_name').notNull(),
  displayNameAr: text('display_name_ar').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  isActive: boolean('is_active').default(true),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classrooms.teacherId],
    references: [users.id],
  }),
  students: many(classroomStudents),
}));

export const classroomStudentsRelations = relations(classroomStudents, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [classroomStudents.classroomId],
    references: [classrooms.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Classroom = typeof classrooms.$inferSelect;
export type NewClassroom = typeof classrooms.$inferInsert;
export type ClassroomStudent = typeof classroomStudents.$inferSelect;
export type NewClassroomStudent = typeof classroomStudents.$inferInsert;
