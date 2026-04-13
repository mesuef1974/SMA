import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getChallengeReport } from '@/db/queries';
import { ReportView } from './report-view';

type Props = {
  params: Promise<{ locale: string; challengeId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'challengeReport' });
  return { title: t('title') };
}

/**
 * Challenge report page (server component).
 * Fetches the full report and passes it to the client view.
 */
export default async function ChallengeReportPage({ params }: Props) {
  const { locale, challengeId } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'teacher' && session.user.role !== 'admin') {
    redirect(`/${locale}/dashboard`);
  }

  const report = await getChallengeReport(challengeId);

  if (!report || !report.challenge.endedAt) {
    redirect(`/${locale}/dashboard/challenges`);
  }

  return <ReportView report={report} />;
}
