/**
 * P1.3 — DAL for advisor review history (lesson_plan_reviews).
 *
 * The table is append-only: every call to the advisor-decision API writes
 * a new row. The UI reads the list sorted by created_at DESC to render a
 * timeline.
 */

import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { lessonPlanReviews } from '@/db/schema';
import type { NewLessonPlanReview } from '@/db/schema';

/**
 * Insert a new review row. Returns the inserted record.
 */
export async function createLessonPlanReview(row: NewLessonPlanReview) {
  const [inserted] = await db
    .insert(lessonPlanReviews)
    .values(row)
    .returning();
  return inserted;
}

/**
 * List all review rows for a plan, newest first, with the reviewer's
 * name (both Arabic + English) joined in for display.
 */
export async function getLessonPlanReviewsByPlanId(planId: string) {
  return db.query.lessonPlanReviews.findMany({
    where: eq(lessonPlanReviews.lessonPlanId, planId),
    orderBy: [desc(lessonPlanReviews.createdAt)],
    with: {
      reviewer: {
        columns: {
          id: true,
          fullName: true,
          fullNameAr: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
