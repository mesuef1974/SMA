import { relations, sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums (names must match existing DB enums exactly)
// ---------------------------------------------------------------------------

export const curriculumSourceKindEnum = pgEnum('curriculum_source_kind', [
  'guide_philosophy',
  'unit_intro',
  'lesson_content',
]);

export const curriculumSourceBookEnum = pgEnum('curriculum_source_book', [
  'TE',
  'SE',
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

// NOTE: DB enforces UNIQUE(kind, book, unit_number, lesson_number) NULLS NOT
// DISTINCT. Not modeled here because drizzle-orm 0.45.x uniqueIndex does not
// yet expose `.nullsNotDistinct()`. The constraint lives in the DB migration.
export const curriculumSources = pgTable('curriculum_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: curriculumSourceKindEnum('kind').notNull(),
  book: curriculumSourceBookEnum('book').notNull(),
  unitNumber: integer('unit_number'),
  lessonNumber: integer('lesson_number'),
  label: text('label').notNull(),
  pdfPath: text('pdf_path').notNull(),
  pageStart: integer('page_start').notNull(),
  pageEnd: integer('page_end').notNull(),
  ocrModel: text('ocr_model'),
  ocrDpi: integer('ocr_dpi'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const curriculumPages = pgTable('curriculum_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id')
    .notNull()
    .references(() => curriculumSources.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  contentAr: text('content_ar').notNull().default(''),
  formulasLatex: jsonb('formulas_latex').default(sql`'[]'::jsonb`),
  figures: jsonb('figures').default(sql`'[]'::jsonb`),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const curriculumSourcesRelations = relations(
  curriculumSources,
  ({ many }) => ({
    pages: many(curriculumPages),
  }),
);

export const curriculumPagesRelations = relations(curriculumPages, ({ one }) => ({
  source: one(curriculumSources, {
    fields: [curriculumPages.sourceId],
    references: [curriculumSources.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CurriculumSource = typeof curriculumSources.$inferSelect;
export type NewCurriculumSource = typeof curriculumSources.$inferInsert;
export type CurriculumPage = typeof curriculumPages.$inferSelect;
export type NewCurriculumPage = typeof curriculumPages.$inferInsert;
