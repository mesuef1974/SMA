import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { DashboardHome } from './dashboard-home';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  return <DashboardHome userName={session?.user?.name} />;
}
