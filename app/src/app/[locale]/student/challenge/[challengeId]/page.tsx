import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { eq, and } from 'drizzle-orm';

import { db } from '@/db';
import { challenges, challengeParticipants, challengeTeams } from '@/db/schema';
import { ChallengeView } from './challenge-view';

type Props = {
  params: Promise<{ locale: string; challengeId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'challenge' });
  return { title: t('liveChallenge') };
}

/**
 * Student challenge page (server component).
 * Reads studentId from cookie, verifies participation, and renders the client view.
 */
export default async function StudentChallengePage({ params }: Props) {
  const { locale, challengeId } = await params;
  setRequestLocale(locale);

  // Cookie-based student auth
  const cookieStore = await cookies();
  const studentId = cookieStore.get('studentId')?.value;

  if (!studentId) {
    const prefix = locale === 'ar' ? '' : `/${locale}`;
    redirect(`${prefix}/student`);
  }

  // Fetch challenge
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });

  if (!challenge) {
    notFound();
  }

  // Find participant record
  const participant = await db.query.challengeParticipants.findFirst({
    where: and(
      eq(challengeParticipants.challengeId, challengeId),
      eq(challengeParticipants.studentId, studentId),
    ),
  });

  if (!participant) {
    notFound();
  }

  // Find the team this student belongs to
  const team = await db.query.challengeTeams.findFirst({
    where: eq(challengeTeams.id, participant.teamId),
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <ChallengeView
        challengeId={challengeId}
        titleAr={challenge.titleAr}
        questionCount={challenge.questionCount}
        timeLimitSeconds={challenge.timeLimitSeconds}
        teamNameAr={team?.nameAr ?? ''}
        teamColor={team?.color ?? 'var(--team-1)'}
        participantId={participant.id}
        locale={locale}
      />
    </div>
  );
}
