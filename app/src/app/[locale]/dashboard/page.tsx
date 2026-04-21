import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTeacherDashboardData } from '@/lib/teacher-dashboard';
import { DashboardShell, type DashboardStat } from './dashboard-shell';

type Props = {
  params: Promise<{ locale: string }>;
};

// Teacher UI v2 — promoted to the main dashboard route.
// Data is fetched directly via Drizzle in this RSC (no API hop).
export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const data = await getTeacherDashboardData(session.user.id);

  const stats: DashboardStat[] = [
    {
      label: 'تحضيرات الدروس',
      value: String(data.stats.totalPlans),
      sub: `${data.stats.approved} معتمد · ${data.stats.drafts} مسودة`,
      accent: 'var(--sma-najm-500)',
      deltaDir: 'flat',
    },
    {
      label: 'الدروس في المنهج',
      value: String(data.stats.totalLessons),
      sub: 'إجمالي الدروس',
      accent: 'var(--success)',
      deltaDir: 'flat',
    },
    {
      label: 'المفاهيم الخاطئة',
      value: String(data.stats.recentMisconceptionCount),
      sub: 'آخر 7 أيام',
      accent: 'var(--sma-qamar-500)',
      deltaDir: 'flat',
    },
    {
      label: 'نسبة الإنجاز',
      value: `${data.stats.completionPct}%`,
      sub: `${data.stats.approved} من ${data.stats.totalLessons}`,
      accent: 'var(--sma-sahla-500)',
      deltaDir: 'flat',
    },
  ];

  const todayLabel = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-QA' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  ).format(new Date());

  return (
    <DashboardShell
      localePath={`/${locale}`}
      userName={session.user.name}
      todayLabel={todayLabel}
      stats={stats}
      todayLesson={data.todayLesson}
      weekLessons={data.weekLessons.map((l) => ({
        id: l.planId ?? l.id,
        number: l.number,
        chapter: l.chapter,
        title: l.title,
        period: l.period,
        minutes: l.minutes,
        status: l.status,
      }))}
      misconceptions={data.misconceptions.map((m) => ({
        id: m.id,
        name_ar: m.name_ar,
        frequency: m.frequency,
        severity: m.severity,
      }))}
      bloom={data.bloom}
    />
  );
}

export const metadata = {
  title: 'لوحة المعلم — SMA',
};
