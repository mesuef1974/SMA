import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getStudentById } from '@/db/queries';
import { StudentDashboardView } from './student-dashboard-view';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'student' });
  return { title: t('dashboardTitle') };
}

/**
 * Student dashboard — displays the student's name, class info,
 * and a placeholder for exercises (coming in S2-2).
 * Reads studentId from cookies to identify the session.
 */
export default async function StudentDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const studentId = cookieStore.get('studentId')?.value;

  if (!studentId) {
    const prefix = locale === 'ar' ? '' : `/${locale}`;
    redirect(`${prefix}/student`);
  }

  const student = await getStudentById(studentId);

  if (!student) {
    const prefix = locale === 'ar' ? '' : `/${locale}`;
    redirect(`${prefix}/student`);
  }

  const classNameDisplay = locale === 'ar'
    ? student.classroom.nameAr
    : student.classroom.name;

  return (
    <StudentDashboardView
      studentName={student.displayNameAr || student.displayName}
      className={classNameDisplay}
    />
  );
}
