import { setRequestLocale } from 'next-intl/server';
import { HomeContent } from './home-content';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}
