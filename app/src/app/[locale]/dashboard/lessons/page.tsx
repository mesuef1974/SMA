import { setRequestLocale } from 'next-intl/server';
import { LessonsView } from './lessons-view';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LessonsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LessonsView />;
}
