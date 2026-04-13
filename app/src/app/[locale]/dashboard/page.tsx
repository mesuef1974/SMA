import { setRequestLocale } from 'next-intl/server';
import { DashboardHome } from './dashboard-home';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardHome />;
}
