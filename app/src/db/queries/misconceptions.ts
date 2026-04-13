import { count, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { misconceptionTypes, studentMisconceptions } from '@/db/schema';
import type { NewStudentMisconception } from '@/db/schema';

// ---------------------------------------------------------------------------
// Misconceptions DAL — tracking and aggregating student misconceptions
// ---------------------------------------------------------------------------

/**
 * Fetch all misconception records for a student.
 * Optionally filter by lesson.
 * Includes the related misconception type for display.
 * Primary use: student profile — misconceptions tab.
 */
export async function getStudentMisconceptions(studentId: string, lessonId?: string) {
  return db.query.studentMisconceptions.findMany({
    where: lessonId
      ? (sm, { eq, and }) =>
          and(eq(sm.studentId, studentId), eq(sm.lessonId, lessonId))
      : eq(studentMisconceptions.studentId, studentId),
    orderBy: (sm, { desc }) => desc(sm.detectedAt),
    with: {
      misconceptionType: true,
      lesson: true,
    },
    limit: 100,
  });
}

/**
 * Aggregate misconception frequency for a given lesson.
 * Returns misconception types ranked by how often they occur,
 * most common first.
 * Primary use: teacher analytics dashboard per lesson.
 */
export async function getMisconceptionStats(lessonId: string) {
  return db
    .select({
      misconceptionTypeId: studentMisconceptions.misconceptionTypeId,
      name: misconceptionTypes.name,
      nameAr: misconceptionTypes.nameAr,
      category: misconceptionTypes.category,
      severity: misconceptionTypes.severity,
      occurrences: count(studentMisconceptions.id),
    })
    .from(studentMisconceptions)
    .innerJoin(
      misconceptionTypes,
      eq(studentMisconceptions.misconceptionTypeId, misconceptionTypes.id),
    )
    .where(eq(studentMisconceptions.lessonId, lessonId))
    .groupBy(
      studentMisconceptions.misconceptionTypeId,
      misconceptionTypes.name,
      misconceptionTypes.nameAr,
      misconceptionTypes.category,
      misconceptionTypes.severity,
    )
    .orderBy(desc(count(studentMisconceptions.id)))
    .limit(50);
}

/**
 * Record a newly detected student misconception.
 * Returns the created row.
 */
export async function logMisconception(data: NewStudentMisconception) {
  const [inserted] = await db
    .insert(studentMisconceptions)
    .values(data)
    .returning();
  return inserted;
}
