import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

import {
  getStudentById,
  getClassLeaderboard,
  getStudentXP,
  getStudentBadges,
} from '@/db/queries';
import { getLevelInfo, getNextLevelXP } from '@/lib/gamification/levels';
import { StudentLeaderboardView } from './student-leaderboard-view';

// ---------------------------------------------------------------------------
// Student Leaderboard
// /[locale]/student/dashboard/leaderboard
// No auth required — student identity from cookie
// ---------------------------------------------------------------------------

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'leaderboard' });
  return { title: t('title') };
}

export default async function StudentLeaderboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const studentId = cookieStore.get('studentId')?.value;

  if (!studentId) {
    redirect(`/${locale}/student`);
  }

  // Fetch all data in parallel
  const [student, xpData, badges] = await Promise.all([
    getStudentById(studentId),
    getStudentXP(studentId),
    getStudentBadges(studentId),
  ]);

  if (!student) {
    redirect(`/${locale}/student`);
  }

  // Get full classroom leaderboard
  const leaderboard = await getClassLeaderboard(student.classroomId);

  // Find current student's position in leaderboard
  const myIndex = leaderboard.findIndex((entry) => entry.studentId === studentId);
  const myRank = myIndex >= 0 ? myIndex + 1 : leaderboard.length + 1;

  // Get nearby students (5 above and 5 below)
  const startIdx = Math.max(0, myIndex - 5);
  const endIdx = Math.min(leaderboard.length, myIndex + 6);
  const nearbyEntries = leaderboard.slice(startIdx, endIdx);

  const nearby = nearbyEntries.map((entry, idx) => {
    const rank = startIdx + idx + 1;
    const entryXpTotal = entry.xpTotal ?? 0;
    const entryLevel = entry.level ?? 1;
    const entryLevelInfo = getLevelInfo(entryLevel);
    const entryNextXp = getNextLevelXP(entryLevel);
    const currentLevelXp = entryLevelInfo.xpRequired;

    let progressPercent = 100;
    if (entryNextXp !== null) {
      const range = entryNextXp - currentLevelXp;
      const progress = entryXpTotal - currentLevelXp;
      progressPercent = range > 0 ? Math.round((progress / range) * 100) : 0;
    }

    return {
      studentId: entry.studentId,
      displayName: entry.displayName ?? '',
      displayNameAr: entry.displayNameAr ?? '',
      xpTotal: entryXpTotal,
      level: entryLevel,
      levelNameAr: entryLevelInfo.nameAr,
      progressPercent,
      rank,
      isCurrentStudent: entry.studentId === studentId,
    };
  });

  // Current student's level info
  const levelInfo = getLevelInfo(xpData.level);
  const nextLevelXp = getNextLevelXP(xpData.level);
  const currentLevelXp = levelInfo.xpRequired;

  let progressPercent = 100;
  if (nextLevelXp !== null) {
    const range = nextLevelXp - currentLevelXp;
    const progress = xpData.xpTotal - currentLevelXp;
    progressPercent = range > 0 ? Math.round((progress / range) * 100) : 0;
  }

  return (
    <StudentLeaderboardView
      studentName={locale === 'ar' ? student.displayNameAr : student.displayName}
      myRank={myRank}
      totalStudents={leaderboard.length}
      xpTotal={xpData.xpTotal}
      level={xpData.level}
      levelNameAr={levelInfo.nameAr}
      progressPercent={progressPercent}
      nextLevelXp={nextLevelXp}
      currentLevelXp={currentLevelXp}
      badges={badges.map((b) => ({
        id: b.id,
        code: b.code,
        nameAr: b.nameAr,
        descriptionAr: b.descriptionAr,
        icon: b.icon,
        category: b.category,
        earnedAt: b.earnedAt?.toISOString() ?? null,
      }))}
      nearby={nearby}
    />
  );
}
