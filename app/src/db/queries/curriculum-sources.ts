import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { curriculumSources } from '@/db/schema';

// ---------------------------------------------------------------------------
// Curriculum sources DAL — fetches OCR'd source text (guide, unit intro,
// lesson content) with all associated pages, used to ground AI generation.
// ---------------------------------------------------------------------------

export type CurriculumBook = 'TE' | 'SE';

export interface CurriculumSourceWithPages {
  id: string;
  kind: string;
  book: CurriculumBook;
  pages: Array<{ pageNumber: number; contentAr: string | null }>;
}

/**
 * Shared shape returned by Drizzle for `findFirst` on curriculumSources
 * with its `pages` relation. Narrowed to the fields this DAL exposes.
 */
type SourceRow = {
  id: string;
  kind: string;
  book: CurriculumBook;
  pages: Array<{ pageNumber: number; contentAr: string | null }>;
};

function normalize(row: SourceRow | undefined): CurriculumSourceWithPages | null {
  if (!row) return null;
  return {
    id: row.id,
    kind: row.kind,
    book: row.book,
    pages: row.pages.map((p) => ({
      pageNumber: p.pageNumber,
      contentAr: p.contentAr ?? null,
    })),
  };
}

/**
 * Fetch the teacher-guide philosophy source (kind='guide_philosophy')
 * for the requested book, with all pages ordered by page_number.
 */
export async function getGuidePhilosophy(
  book: CurriculumBook = 'TE',
): Promise<CurriculumSourceWithPages | null> {
  const row = await db.query.curriculumSources.findFirst({
    where: and(
      eq(curriculumSources.kind, 'guide_philosophy'),
      eq(curriculumSources.book, book),
    ),
    with: {
      pages: {
        orderBy: (p, { asc }) => asc(p.pageNumber),
      },
    },
  });
  return normalize(row as SourceRow | undefined);
}

/**
 * Fetch the unit-intro source (kind='unit_intro') for a specific unit and book.
 */
export async function getUnitIntro(
  unitNumber: number,
  book: CurriculumBook,
): Promise<CurriculumSourceWithPages | null> {
  const row = await db.query.curriculumSources.findFirst({
    where: and(
      eq(curriculumSources.kind, 'unit_intro'),
      eq(curriculumSources.book, book),
      eq(curriculumSources.unitNumber, unitNumber),
    ),
    with: {
      pages: {
        orderBy: (p, { asc }) => asc(p.pageNumber),
      },
    },
  });
  return normalize(row as SourceRow | undefined);
}

/**
 * Fetch the lesson-content source (kind='lesson_content') for a specific
 * unit + lesson + book, with all OCR'd pages in order.
 */
export async function getLessonContent(
  unitNumber: number,
  lessonNumber: number,
  book: CurriculumBook,
): Promise<CurriculumSourceWithPages | null> {
  const row = await db.query.curriculumSources.findFirst({
    where: and(
      eq(curriculumSources.kind, 'lesson_content'),
      eq(curriculumSources.book, book),
      eq(curriculumSources.unitNumber, unitNumber),
      eq(curriculumSources.lessonNumber, lessonNumber),
    ),
    with: {
      pages: {
        orderBy: (p, { asc }) => asc(p.pageNumber),
      },
    },
  });
  return normalize(row as SourceRow | undefined);
}
