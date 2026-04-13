import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { lessonPlans } from '@/db/schema';
import type { NewLessonPlan } from '@/db/schema';

// ---------------------------------------------------------------------------
// Lesson Plans DAL — CRUD for teacher lesson preparations
// ---------------------------------------------------------------------------

/**
 * List all lesson plans authored by a specific teacher.
 * Includes the related lesson (with chapter) for display purposes.
 * Results are ordered newest-first.
 * Primary use: teacher "My Plans" page.
 */
export async function getLessonPlansByTeacher(teacherId: string) {
  return db.query.lessonPlans.findMany({
    where: eq(lessonPlans.teacherId, teacherId),
    orderBy: (lp, { desc }) => desc(lp.createdAt),
    with: {
      lesson: {
        with: {
          chapter: true,
        },
      },
    },
    limit: 100,
  });
}

/**
 * Fetch a single lesson plan with full detail:
 *   - related lesson (+ chapter + learning outcomes)
 *   - teacher info
 *   - reviewer info (if reviewed)
 * Primary use: lesson-plan editor / detail view.
 */
export async function getLessonPlanById(planId: string) {
  return db.query.lessonPlans.findFirst({
    where: eq(lessonPlans.id, planId),
    with: {
      lesson: {
        with: {
          chapter: true,
          learningOutcomes: true,
        },
      },
      teacher: true,
      reviewer: true,
    },
  });
}

/**
 * Insert a new lesson plan record.
 * Returns the created row.
 */
export async function createLessonPlan(data: NewLessonPlan) {
  const [inserted] = await db.insert(lessonPlans).values(data).returning();
  return inserted;
}

/**
 * Partially update an existing lesson plan.
 * Returns the updated row.
 */
export async function updateLessonPlan(planId: string, data: Partial<NewLessonPlan>) {
  const [updated] = await db
    .update(lessonPlans)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(lessonPlans.id, planId))
    .returning();
  return updated;
}
