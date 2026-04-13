import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getChallengeStatus, getChallengeLeaderboard } from '@/db/queries';
import { ProjectorView } from './projector-view';

type Props = {
  params: Promise<{ locale: string; challengeId: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projector' });
  return { title: t('title') };
}

/**
 * Challenge projector page (server component).
 * Full-screen view optimised for projection on a large screen.
 * Teacher auth required.
 */
export default async function ProjectorPage({ params }: Props) {
  const { locale, challengeId } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'teacher') {
    redirect('/login');
  }

  // Fetch initial challenge data
  const [status, leaderboard] = await Promise.all([
    getChallengeStatus(challengeId),
    getChallengeLeaderboard(challengeId),
  ]);

  if (!status) {
    redirect(`/${locale}/dashboard/challenges`);
  }

  return (
    <ProjectorView
      challengeId={challengeId}
      initialStatus={{
        titleAr: status.titleAr,
        status: status.status as 'draft' | 'active' | 'completed',
        timeRemaining: status.timeRemaining,
        timeLimitSeconds: status.timeLimitSeconds,
        questionCount: status.questionCount,
        participantCount: status.participantCount,
        responseCount: status.responseCount,
      }}
      initialTeams={leaderboard.map((team) => ({
        id: team.id,
        nameAr: team.nameAr,
        color: team.color,
        score: team.score,
        correctCount: team.correctCount,
      }))}
    />
  );
}
