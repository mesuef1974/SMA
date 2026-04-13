import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTeacherClassrooms } from '@/db/queries';
import { db } from '@/db';
import { challenges, challengeTeams, challengeParticipants } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { ChallengesView } from './challenges-view';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'challenge' });
  return { title: t('title') };
}

/**
 * Teacher challenges page (server component).
 * Fetches classrooms and existing challenges, then renders the client view.
 */
export default async function ChallengesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;

  // Fetch classrooms and challenges in parallel
  const [classrooms, teacherChallenges] = await Promise.all([
    getTeacherClassrooms(teacherId),
    db
      .select()
      .from(challenges)
      .where(eq(challenges.teacherId, teacherId))
      .orderBy(desc(challenges.createdAt)),
  ]);

  // Fetch team and participant counts for each challenge
  const challengeData = await Promise.all(
    teacherChallenges.map(async (challenge) => {
      const [teamCount] = await db
        .select({ count: count(challengeTeams.id) })
        .from(challengeTeams)
        .where(eq(challengeTeams.challengeId, challenge.id));

      const [participantCount] = await db
        .select({ count: count(challengeParticipants.id) })
        .from(challengeParticipants)
        .where(eq(challengeParticipants.challengeId, challenge.id));

      // Find the classroom name for this challenge
      const classroom = classrooms.find((c) => c.id === challenge.classroomId);

      return {
        id: challenge.id,
        titleAr: challenge.titleAr,
        status: challenge.status as 'draft' | 'active' | 'completed',
        questionCount: challenge.questionCount,
        timeLimitSeconds: challenge.timeLimitSeconds,
        classroomName: classroom?.nameAr ?? classroom?.name ?? '',
        teamCount: teamCount?.count ?? 0,
        participantCount: participantCount?.count ?? 0,
        createdAt: challenge.createdAt?.toISOString() ?? '',
        startedAt: challenge.startedAt?.toISOString() ?? null,
        endedAt: challenge.endedAt?.toISOString() ?? null,
      };
    }),
  );

  // Serialize classrooms for the client
  const classroomData = classrooms.map((c) => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    studentsCount: c.students.length,
  }));

  return (
    <ChallengesView
      challenges={challengeData}
      classrooms={classroomData}
    />
  );
}
