import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { StudentJoinForm } from './student-join-form';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'student' });
  return { title: t('title') };
}

/**
 * Student landing page — public, no auth required.
 * Displays a form where students enter the class code and their name to join.
 */
export default async function StudentPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StudentJoinForm />;
}
