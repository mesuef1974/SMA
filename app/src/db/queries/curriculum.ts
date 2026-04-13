import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  chapters,
  gradeLevels,
  learningOutcomes,
  lessons,
  subjects,
} from '@/db/schema';
import type { Chapter, LearningOutcome } from '@/db/schema';

// ---------------------------------------------------------------------------
// Curriculum DAL — subjects, grade-levels, chapters, lessons, outcomes
// ---------------------------------------------------------------------------

/**
 * Fetch every lesson under a grade-level, grouped by chapter.
 * Returns chapters (sorted) with their nested lessons.
 * Primary use: teacher dashboard — curriculum browser.
 */
export async function getLessonsWithChapter(gradeLevelId: string) {
  return db.query.chapters.findMany({
    where: eq(chapters.gradeLevelId, gradeLevelId),
    orderBy: (ch, { asc }) => asc(ch.sortOrder),
    with: {
      lessons: {
        orderBy: (l, { asc }) => asc(l.sortOrder),
      },
    },
  });
}

/**
 * Fetch a single lesson by ID together with its learning outcomes.
 * Primary use: lesson detail view, lesson-plan creation.
 */
export async function getLessonById(lessonId: string) {
  return db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      chapter: true,
      learningOutcomes: {
        orderBy: (lo, { asc }) => asc(lo.sortOrder),
      },
    },
  });
}

/**
 * Fetch learning outcomes for a specific lesson.
 * Primary use: outcome selection when building assessments / plans.
 */
export async function getLearningOutcomes(lessonId: string): Promise<LearningOutcome[]> {
  return db.query.learningOutcomes.findMany({
    where: eq(learningOutcomes.lessonId, lessonId),
    orderBy: (lo, { asc }) => asc(lo.sortOrder),
  });
}

/**
 * List all chapters belonging to a grade-level, ordered by sortOrder.
 * Primary use: chapter navigation sidebar.
 */
export async function getChaptersByGradeLevel(gradeLevelId: string): Promise<Chapter[]> {
  return db.query.chapters.findMany({
    where: eq(chapters.gradeLevelId, gradeLevelId),
    orderBy: (ch, { asc }) => asc(ch.sortOrder),
  });
}

/**
 * Resolve the grade-level record for a given subject code + academic year.
 * Primary use: initial curriculum routing from subject selection.
 */
export async function getGradeLevelForSubject(subjectCode: string, academicYear: string) {
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.code, subjectCode),
  });

  if (!subject) return undefined;

  return db.query.gradeLevels.findFirst({
    where: and(
      eq(gradeLevels.subjectId, subject.id),
      eq(gradeLevels.academicYear, academicYear),
    ),
    with: {
      subject: true,
    },
  });
}
