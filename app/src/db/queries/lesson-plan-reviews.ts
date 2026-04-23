/**
 * P1.3 — DAL for advisor review history (lesson_plan_reviews).
 *
 * The table is append-only: every call to the advisor-decision API writes
 * a new row. The UI reads the list sorted by created_at DESC to render a
 * timeline.
 */

import { and, desc, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { lessonPlanReviews, lessonPlans } from '@/db/schema';
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

// ---------------------------------------------------------------------------
// BL-026 — teacher notification feed
// ---------------------------------------------------------------------------

/**
 * List unread advisor reviews for every lesson plan owned by `teacherId`,
 * newest first. Joined with the plan (for title/lesson linking) and the
 * reviewer (for attribution).
 */
export async function getUnreadReviewsForTeacher(teacherId: string) {
  return db
    .select({
      id: lessonPlanReviews.id,
      lessonPlanId: lessonPlanReviews.lessonPlanId,
      decision: lessonPlanReviews.decision,
      comment: lessonPlanReviews.comment,
      createdAt: lessonPlanReviews.createdAt,
      lessonId: lessonPlans.lessonId,
      periodNumber: lessonPlans.periodNumber,
    })
    .from(lessonPlanReviews)
    .innerJoin(lessonPlans, eq(lessonPlanReviews.lessonPlanId, lessonPlans.id))
    .where(
      and(
        eq(lessonPlans.teacherId, teacherId),
        isNull(lessonPlanReviews.readByTeacherAt),
      ),
    )
    .orderBy(desc(lessonPlanReviews.createdAt));
}

/**
 * Mark all currently-unread reviews on the given plan as read by the
 * plan's owning teacher. Scoped by teacherId so a teacher cannot clear
 * another teacher's queue even with a guessed planId.
 *
 * If `planId` is omitted, marks every unread review across all of the
 * teacher's plans as read (used when the bell dropdown has a
 * "اعتبر الكل مقروءاً" action).
 */
export async function markReviewsReadForTeacher(
  teacherId: string,
  planId?: string,
): Promise<number> {
  // Resolve the set of plans we're allowed to touch for this teacher.
  const ownedPlans = await db
    .select({ id: lessonPlans.id })
    .from(lessonPlans)
    .where(
      planId
        ? and(eq(lessonPlans.teacherId, teacherId), eq(lessonPlans.id, planId))
        : eq(lessonPlans.teacherId, teacherId),
    );

  if (ownedPlans.length === 0) return 0;
  const planIds = ownedPlans.map((p) => p.id);

  const updated = await db
    .update(lessonPlanReviews)
    .set({ readByTeacherAt: new Date() })
    .where(
      and(
        inArray(lessonPlanReviews.lessonPlanId, planIds),
        isNull(lessonPlanReviews.readByTeacherAt),
      ),
    )
    .returning({ id: lessonPlanReviews.id });

  return updated.length;
}
