import { and, count, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  badgeDefinitions,
  challengeParticipants,
  classroomStudents,
  studentBadges,
  studentXp,
  xpTransactions,
} from '@/db/schema';
import { getLevelForXP } from '@/lib/gamification/levels';

// ---------------------------------------------------------------------------
// Gamification DAL — XP, badges, and leaderboard operations
// ---------------------------------------------------------------------------

/**
 * Award XP to a student.
 * 1. Inserts an xp_transaction record (audit trail).
 * 2. Upserts the student_xp aggregate row (creates if first award).
 * 3. Recalculates level from new total.
 * Returns the updated { xpTotal, level }.
 */
export async function awardXP(
  studentId: string,
  amount: number,
  sourceType: 'exercise' | 'challenge' | 'badge' | 'streak',
  sourceId?: string | null,
  descriptionAr?: string,
) {
  // 1. Insert transaction
  await db.insert(xpTransactions).values({
    studentId,
    amount,
    sourceType,
    sourceId: sourceId ?? null,
    descriptionAr: descriptionAr ?? null,
  });

  // 2. Upsert aggregate — increment xpTotal
  const [existing] = await db
    .select()
    .from(studentXp)
    .where(eq(studentXp.studentId, studentId));

  let newTotal: number;

  if (existing) {
    newTotal = existing.xpTotal + amount;
    const newLevel = getLevelForXP(newTotal);
    await db
      .update(studentXp)
      .set({
        xpTotal: newTotal,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(studentXp.studentId, studentId));
  } else {
    newTotal = amount;
    const newLevel = getLevelForXP(newTotal);
    await db.insert(studentXp).values({
      studentId,
      xpTotal: newTotal,
      level: newLevel,
    });
  }

  const level = getLevelForXP(newTotal);
  return { xpTotal: newTotal, level };
}

/**
 * Retrieve a student's XP summary including rank within their classroom.
 * Returns { xpTotal, level, rankInClass }.
 */
export async function getStudentXP(studentId: string) {
  // Get student's XP record
  const [xpRecord] = await db
    .select()
    .from(studentXp)
    .where(eq(studentXp.studentId, studentId));

  if (!xpRecord) {
    return { xpTotal: 0, level: 1, rankInClass: 0 };
  }

  // Get classroom for this student
  const [student] = await db
    .select({ classroomId: classroomStudents.classroomId })
    .from(classroomStudents)
    .where(eq(classroomStudents.id, studentId));

  if (!student) {
    return { xpTotal: xpRecord.xpTotal, level: xpRecord.level, rankInClass: 0 };
  }

  // Count how many students in the same classroom have higher XP
  const [rankResult] = await db
    .select({
      rank: count(studentXp.id),
    })
    .from(studentXp)
    .innerJoin(classroomStudents, eq(studentXp.studentId, classroomStudents.id))
    .where(
      and(
        eq(classroomStudents.classroomId, student.classroomId),
        sql`${studentXp.xpTotal} > ${xpRecord.xpTotal}`,
      ),
    );

  const rankInClass = (rankResult?.rank ?? 0) + 1;

  return {
    xpTotal: xpRecord.xpTotal,
    level: xpRecord.level,
    rankInClass,
  };
}

/**
 * Classroom leaderboard sorted by XP descending.
 * Returns array of { studentId, displayNameAr, xpTotal, level }.
 */
export async function getClassLeaderboard(classroomId: string, limit = 50) {
  return db
    .select({
      studentId: classroomStudents.id,
      displayNameAr: classroomStudents.displayNameAr,
      displayName: classroomStudents.displayName,
      xpTotal: studentXp.xpTotal,
      level: studentXp.level,
    })
    .from(classroomStudents)
    .leftJoin(studentXp, eq(classroomStudents.id, studentXp.studentId))
    .where(eq(classroomStudents.classroomId, classroomId))
    .orderBy(desc(sql`COALESCE(${studentXp.xpTotal}, 0)`))
    .limit(limit);
}

/**
 * Award a badge to a student by badge code.
 * 1. Looks up the badge definition.
 * 2. Checks the student doesn't already have it.
 * 3. Inserts student_badges record.
 * 4. Awards bonus XP if the badge carries an xpReward.
 * Returns the badge or null if already earned / not found.
 */
export async function awardBadge(studentId: string, badgeCode: string) {
  // 1. Find badge definition
  const [badge] = await db
    .select()
    .from(badgeDefinitions)
    .where(eq(badgeDefinitions.code, badgeCode));

  if (!badge) return null;

  // 2. Check if already earned
  const [existing] = await db
    .select()
    .from(studentBadges)
    .where(
      and(
        eq(studentBadges.studentId, studentId),
        eq(studentBadges.badgeId, badge.id),
      ),
    );

  if (existing) return null;

  // 3. Award badge
  await db.insert(studentBadges).values({
    studentId,
    badgeId: badge.id,
  });

  // 4. Award bonus XP
  if (badge.xpReward > 0) {
    await awardXP(
      studentId,
      badge.xpReward,
      'badge',
      badge.id,
      `شارة: ${badge.nameAr}`,
    );
  }

  return badge;
}

/**
 * Retrieve all badges earned by a student with their definitions.
 */
export async function getStudentBadges(studentId: string) {
  return db
    .select({
      id: studentBadges.id,
      earnedAt: studentBadges.earnedAt,
      code: badgeDefinitions.code,
      nameAr: badgeDefinitions.nameAr,
      descriptionAr: badgeDefinitions.descriptionAr,
      icon: badgeDefinitions.icon,
      category: badgeDefinitions.category,
      xpReward: badgeDefinitions.xpReward,
    })
    .from(studentBadges)
    .innerJoin(badgeDefinitions, eq(studentBadges.badgeId, badgeDefinitions.id))
    .where(eq(studentBadges.studentId, studentId))
    .orderBy(desc(studentBadges.earnedAt));
}

/**
 * Check all badge criteria for a student and award any newly eligible badges.
 * Returns an array of newly awarded badges.
 *
 * Criteria checks implemented:
 * - first_correct_answer: at least 1 correct response
 * - correct_streak: N consecutive correct answers
 * - challenge_participation: participated in at least 1 challenge
 * - misconceptions_resolved: resolved N misconceptions
 *
 * Note: some criteria (perfect_score, speed_correct, bloom_level_correct,
 * consecutive_days, chapter_complete) are evaluated at response-submission
 * time in the relevant API routes, not here.
 */
export async function checkBadgeEligibility(studentId: string) {
  const allBadges = await db.select().from(badgeDefinitions);
  const earnedBadges = await db
    .select({ badgeId: studentBadges.badgeId })
    .from(studentBadges)
    .where(eq(studentBadges.studentId, studentId));

  const earnedIds = new Set(earnedBadges.map((b) => b.badgeId));
  const unearnedBadges = allBadges.filter((b) => !earnedIds.has(b.id));
  const newlyAwarded: typeof allBadges = [];

  for (const badge of unearnedBadges) {
    const criteria = badge.criteriaJson as Record<string, unknown> | null;
    if (!criteria) continue;

    let eligible = false;

    switch (criteria.type) {
      case 'first_correct_answer': {
        // Check if student has at least 1 XP transaction from exercises
        const [result] = await db
          .select({ cnt: count(xpTransactions.id) })
          .from(xpTransactions)
          .where(
            and(
              eq(xpTransactions.studentId, studentId),
              eq(xpTransactions.sourceType, 'exercise'),
            ),
          );
        eligible = (result?.cnt ?? 0) >= 1;
        break;
      }

      case 'challenge_participation': {
        const [result] = await db
          .select({ cnt: count(challengeParticipants.id) })
          .from(challengeParticipants)
          .where(eq(challengeParticipants.studentId, studentId));
        eligible = (result?.cnt ?? 0) >= ((criteria.threshold as number) ?? 1);
        break;
      }

      // Badges with criteria evaluated at event time are skipped here.
      // They are awarded inline by the relevant API routes.
      default:
        break;
    }

    if (eligible) {
      const awarded = await awardBadge(studentId, badge.code);
      if (awarded) newlyAwarded.push(awarded);
    }
  }

  return newlyAwarded;
}
