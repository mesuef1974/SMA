import { cookies } from 'next/headers';

import { getStudentXP, getStudentBadges } from '@/db/queries';
import { getLevelInfo, getNextLevelXP } from '@/lib/gamification/levels';

// ---------------------------------------------------------------------------
// GET /api/student/xp
// Returns XP summary, current level info, and earned badges for the
// authenticated student. Student identity from httpOnly cookie.
// ---------------------------------------------------------------------------

export async function GET() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get('studentId')?.value;

  if (!studentId) {
    return Response.json(
      { error: 'غير مصرح — يرجى الانضمام إلى صف أولاً' },
      { status: 401 },
    );
  }

  try {
    const [xpData, badges] = await Promise.all([
      getStudentXP(studentId),
      getStudentBadges(studentId),
    ]);

    const levelInfo = getLevelInfo(xpData.level);
    const nextLevelXP = getNextLevelXP(xpData.level);

    return Response.json(
      {
        xpTotal: xpData.xpTotal,
        level: xpData.level,
        levelNameAr: levelInfo.nameAr,
        bloomAssociation: levelInfo.bloomAssociation,
        rankInClass: xpData.rankInClass,
        nextLevelXP,
        xpToNextLevel: nextLevelXP !== null ? nextLevelXP - xpData.xpTotal : null,
        badges,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[/api/student/xp] Error:', error);
    return Response.json(
      { error: 'حدث خطأ أثناء جلب بيانات النقاط' },
      { status: 500 },
    );
  }
}
