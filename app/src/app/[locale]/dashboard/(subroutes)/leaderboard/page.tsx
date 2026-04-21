import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { desc, eq, sql, inArray } from 'drizzle-orm';

import { auth } from '@/lib/auth';
import { getTeacherClassrooms } from '@/db/queries';
import { getClassLeaderboard } from '@/db/queries';
import { db } from '@/db';
import {
  challengeTeams,
  challengeParticipants,
  challenges,
  studentXp,
  studentBadges,
} from '@/db/schema';
import { getLevelInfo, getNextLevelXP } from '@/lib/gamification/levels';
import { LeaderboardView } from './leaderboard-view';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'leaderboard' });
  return { title: t('title') };
}

/**
 * Teacher leaderboard page (server component).
 * Fetches classrooms, XP leaderboard, badges, and team data,
 * then passes serialized data to the client view.
 */
export default async function LeaderboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;
  const classrooms = await getTeacherClassrooms(teacherId);

  // Build leaderboard data for each classroom in parallel
  const classroomData = await Promise.all(
    classrooms.map(async (classroom) => {
      // 1. Get individual leaderboard
      const leaderboard = await getClassLeaderboard(classroom.id);

      // 2. Bulk-fetch badge counts for all students in one query (avoids N+1)
      const studentIds = leaderboard.map((e) => e.studentId);
      const badgeCountRows = studentIds.length > 0
        ? await db
            .select({
              studentId: studentBadges.studentId,
              count: sql<number>`COUNT(*)`.as('count'),
            })
            .from(studentBadges)
            .where(inArray(studentBadges.studentId, studentIds))
            .groupBy(studentBadges.studentId)
        : [];
      const badgeCountMap = new Map(
        badgeCountRows.map((r) => [r.studentId, Number(r.count)]),
      );

      const studentsWithDetails = leaderboard.map((entry) => {
          const badgesCount = badgeCountMap.get(entry.studentId) ?? 0;
          const xpTotal = entry.xpTotal ?? 0;
          const level = entry.level ?? 1;
          const levelInfo = getLevelInfo(level);
          const nextLevelXp = getNextLevelXP(level);
          const currentLevelXp = levelInfo.xpRequired;

          let progressPercent = 100;
          if (nextLevelXp !== null) {
            const range = nextLevelXp - currentLevelXp;
            const progress = xpTotal - currentLevelXp;
            progressPercent = range > 0 ? Math.round((progress / range) * 100) : 0;
          }

          return {
            studentId: entry.studentId,
            displayName: entry.displayName ?? '',
            displayNameAr: entry.displayNameAr ?? '',
            xpTotal,
            level,
            levelNameAr: levelInfo.nameAr,
            badgesCount,
            progressPercent,
          };
        });

      // 3. Get team leaderboard — aggregate XP per team from completed challenges
      const teamRows = await db
        .select({
          teamId: challengeTeams.id,
          teamNameAr: challengeTeams.nameAr,
          teamColor: challengeTeams.color,
          challengeTitleAr: challenges.titleAr,
          totalXp: sql<number>`COALESCE(SUM(${studentXp.xpTotal}), 0)`.as('total_xp'),
          memberCount: sql<number>`COUNT(DISTINCT ${challengeParticipants.studentId})`.as('member_count'),
        })
        .from(challengeTeams)
        .innerJoin(challenges, eq(challengeTeams.challengeId, challenges.id))
        .leftJoin(challengeParticipants, eq(challengeTeams.id, challengeParticipants.teamId))
        .leftJoin(studentXp, eq(challengeParticipants.studentId, studentXp.studentId))
        .where(eq(challenges.classroomId, classroom.id))
        .groupBy(challengeTeams.id, challengeTeams.nameAr, challengeTeams.color, challenges.titleAr)
        .orderBy(desc(sql`total_xp`));

      const teams = teamRows.map((row) => ({
        teamId: row.teamId,
        nameAr: row.teamNameAr,
        color: row.teamColor,
        challengeTitleAr: row.challengeTitleAr,
        totalXp: Number(row.totalXp),
        memberCount: Number(row.memberCount),
      }));

      return {
        id: classroom.id,
        name: classroom.name,
        nameAr: classroom.nameAr,
        students: studentsWithDetails,
        teams,
      };
    }),
  );

  return <LeaderboardView classrooms={classroomData} />;
}
