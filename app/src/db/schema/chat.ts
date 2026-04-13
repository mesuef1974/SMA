import { relations } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { lessons } from './curriculum';
import { users } from './users';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant', 'system']);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  lessonId: uuid('lesson_id').references(() => lessons.id),
  title: text('title'),
  model: text('model').default('claude-sonnet-4-5-20250929'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => chatSessions.id),
  role: chatRoleEnum('role'),
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [chatSessions.lessonId],
    references: [lessons.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
