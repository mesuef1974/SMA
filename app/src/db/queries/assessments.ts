import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { assessments, studentResponses } from '@/db/schema';
import type { NewAssessment } from '@/db/schema';

// ---------------------------------------------------------------------------
// Assessments DAL — tests, questions, and student responses
// ---------------------------------------------------------------------------

/**
 * List all assessments linked to a lesson.
 * Primary use: lesson detail page — assessments tab.
 */
export async function getAssessmentsByLesson(lessonId: string) {
  return db.query.assessments.findMany({
    where: eq(assessments.lessonId, lessonId),
    orderBy: (a, { desc }) => desc(a.createdAt),
    with: {
      teacher: true,
    },
  });
}

/**
 * Fetch a single assessment together with all its questions (ordered).
 * Primary use: assessment editor / student test view.
 */
export async function getAssessmentWithQuestions(assessmentId: string) {
  return db.query.assessments.findFirst({
    where: eq(assessments.id, assessmentId),
    with: {
      questions: {
        orderBy: (q, { asc }) => asc(q.sortOrder),
      },
      lesson: true,
      teacher: true,
    },
  });
}

/**
 * Retrieve every response a student submitted for a given assessment.
 * Returns questions (ordered) each with the specific student's responses.
 * Primary use: individual student result review.
 */
export async function getStudentResponses(assessmentId: string, studentId: string) {
  const assessment = await db.query.assessments.findFirst({
    where: eq(assessments.id, assessmentId),
    with: {
      questions: {
        with: {
          studentResponses: {
            where: eq(studentResponses.studentId, studentId),
          },
        },
        orderBy: (q, { asc }) => asc(q.sortOrder),
      },
    },
  });

  return assessment?.questions ?? [];
}

/**
 * Insert a new assessment record.
 * Returns the created row.
 */
export async function createAssessment(data: NewAssessment) {
  const [inserted] = await db.insert(assessments).values(data).returning();
  return inserted;
}
