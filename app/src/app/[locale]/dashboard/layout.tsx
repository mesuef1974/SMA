import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Chrome } from '@/components/teacher-ui';
import { auth } from '@/lib/auth';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  return { title: t('title') };
}

// Shared shell for every /{locale}/dashboard/** route.
// Wraps all dashboard subroutes in the unified Chrome (teacher-ui v2) so
// navigation between /dashboard, /dashboard/lessons, /dashboard/classroom, etc.
// stays visually continuous. Auth is enforced here so individual subroute
// pages don't need to re-check.
export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  return <Chrome>{children}</Chrome>;
}
