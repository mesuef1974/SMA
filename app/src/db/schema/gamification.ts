import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { classrooms, classroomStudents } from './classrooms';
import { bloomLevelEnum } from './curriculum';
import { users } from './users';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const xpSourceTypeEnum = pgEnum('xp_source_type', [
  'exercise',
  'challenge',
  'badge',
  'streak',
]);

export const badgeCategoryEnum = pgEnum('badge_category', [
  'academic',
  'behavioral',
  'streak',
  'special',
]);

export const challengeStatusEnum = pgEnum('challenge_status', [
  'draft',
  'active',
  'completed',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/**
 * XP configuration per Bloom taxonomy level.
 * Higher cognitive levels yield more XP — rewards deep learning, not speed.
 */
export const xpConfig = pgTable('xp_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  bloomLevel: bloomLevelEnum('bloom_level').notNull().unique(),
  xpReward: smallint('xp_reward').notNull(),
  descriptionAr: text('description_ar'),
});

/**
 * Aggregated XP totals per student.
 * Updated on every XP transaction — single source of truth for level/rank.
 */
export const studentXp = pgTable('student_xp', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .unique()
    .references(() => classroomStudents.id, { onDelete: 'cascade' }),
  xpTotal: integer('xp_total').notNull().default(0),
  level: smallint('level').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

/**
 * Detailed log of every XP award/deduction.
 * Provides full auditability and analytics on XP sources.
 */
export const xpTransactions = pgTable('xp_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => classroomStudents.id, { onDelete: 'cascade' }),
  amount: smallint('amount').notNull(),
  sourceType: xpSourceTypeEnum('source_type').notNull(),
  sourceId: uuid('source_id'),
  descriptionAr: text('description_ar'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

/**
 * Badge definitions — reusable badge templates with criteria.
 * criteria_json stores machine-readable rules for automatic eligibility checks.
 */
export const badgeDefinitions = pgTable('badge_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  nameAr: text('name_ar').notNull(),
  descriptionAr: text('description_ar').notNull(),
  icon: text('icon').notNull(),
  category: badgeCategoryEnum('category').notNull(),
  xpReward: smallint('xp_reward').notNull().default(0),
  criteriaJson: jsonb('criteria_json'),
});

/**
 * Earned badges per student.
 * Each student can earn each badge at most once (enforced by business logic).
 */
export const studentBadges = pgTable('student_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => classroomStudents.id, { onDelete: 'cascade' }),
  badgeId: uuid('badge_id')
    .notNull()
    .references(() => badgeDefinitions.id, { onDelete: 'cascade' }),
  earnedAt: timestamp('earned_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

/**
 * Live challenges created by teachers for classroom competitions.
 * Teams compete, not individuals — per educational consultant directive (DEC-SMA-031).
 */
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroomId: uuid('classroom_id')
    .notNull()
    .references(() => classrooms.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => users.id),
  titleAr: text('title_ar').notNull(),
  status: challengeStatusEnum('status').notNull().default('draft'),
  questionCount: smallint('question_count').notNull(),
  timeLimitSeconds: smallint('time_limit_seconds').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
  endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
});

/**
 * Teams within a challenge — competition is team-based, not individual.
 */
export const challengeTeams = pgTable('challenge_teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id')
    .notNull()
    .references(() => challenges.id, { onDelete: 'cascade' }),
  nameAr: text('name_ar').notNull(),
  color: text('color'),
});

/**
 * Students assigned to challenge teams.
 */
export const challengeParticipants = pgTable('challenge_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id')
    .notNull()
    .references(() => challenges.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id')
    .notNull()
    .references(() => challengeTeams.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id')
    .notNull()
    .references(() => classroomStudents.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

/**
 * Individual responses within a challenge.
 * Tracks correctness, time, and XP earned per question.
 */
export const challengeResponses = pgTable('challenge_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id')
    .notNull()
    .references(() => challenges.id, { onDelete: 'cascade' }),
  participantId: uuid('participant_id')
    .notNull()
    .references(() => challengeParticipants.id, { onDelete: 'cascade' }),
  questionIndex: smallint('question_index').notNull(),
  response: text('response'),
  isCorrect: boolean('is_correct'),
  timeMs: integer('time_ms'),
  xpEarned: smallint('xp_earned').notNull().default(0),
  submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const xpConfigRelations = relations(xpConfig, () => ({}));

export const studentXpRelations = relations(studentXp, ({ one }) => ({
  student: one(classroomStudents, {
    fields: [studentXp.studentId],
    references: [classroomStudents.id],
  }),
}));

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  student: one(classroomStudents, {
    fields: [xpTransactions.studentId],
    references: [classroomStudents.id],
  }),
}));

export const badgeDefinitionsRelations = relations(badgeDefinitions, ({ many }) => ({
  studentBadges: many(studentBadges),
}));

export const studentBadgesRelations = relations(studentBadges, ({ one }) => ({
  student: one(classroomStudents, {
    fields: [studentBadges.studentId],
    references: [classroomStudents.id],
  }),
  badge: one(badgeDefinitions, {
    fields: [studentBadges.badgeId],
    references: [badgeDefinitions.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [challenges.classroomId],
    references: [classrooms.id],
  }),
  teacher: one(users, {
    fields: [challenges.teacherId],
    references: [users.id],
  }),
  teams: many(challengeTeams),
  participants: many(challengeParticipants),
  responses: many(challengeResponses),
}));

export const challengeTeamsRelations = relations(challengeTeams, ({ one, many }) => ({
  challenge: one(challenges, {
    fields: [challengeTeams.challengeId],
    references: [challenges.id],
  }),
  participants: many(challengeParticipants),
}));

export const challengeParticipantsRelations = relations(challengeParticipants, ({ one, many }) => ({
  challenge: one(challenges, {
    fields: [challengeParticipants.challengeId],
    references: [challenges.id],
  }),
  team: one(challengeTeams, {
    fields: [challengeParticipants.teamId],
    references: [challengeTeams.id],
  }),
  student: one(classroomStudents, {
    fields: [challengeParticipants.studentId],
    references: [classroomStudents.id],
  }),
  responses: many(challengeResponses),
}));

export const challengeResponsesRelations = relations(challengeResponses, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeResponses.challengeId],
    references: [challenges.id],
  }),
  participant: one(challengeParticipants, {
    fields: [challengeResponses.participantId],
    references: [challengeParticipants.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type XpConfig = typeof xpConfig.$inferSelect;
export type NewXpConfig = typeof xpConfig.$inferInsert;
export type StudentXp = typeof studentXp.$inferSelect;
export type NewStudentXp = typeof studentXp.$inferInsert;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type NewXpTransaction = typeof xpTransactions.$inferInsert;
export type BadgeDefinition = typeof badgeDefinitions.$inferSelect;
export type NewBadgeDefinition = typeof badgeDefinitions.$inferInsert;
export type StudentBadge = typeof studentBadges.$inferSelect;
export type NewStudentBadge = typeof studentBadges.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type ChallengeTeam = typeof challengeTeams.$inferSelect;
export type NewChallengeTeam = typeof challengeTeams.$inferInsert;
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type NewChallengeParticipant = typeof challengeParticipants.$inferInsert;
export type ChallengeResponse = typeof challengeResponses.$inferSelect;
export type NewChallengeResponse = typeof challengeResponses.$inferInsert;
