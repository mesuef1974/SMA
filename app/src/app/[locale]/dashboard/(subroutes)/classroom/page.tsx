import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTeacherClassrooms } from '@/db/queries';
import { ClassroomManagementView } from './classroom-management-view';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'classroom' });
  return { title: t('title') };
}

/**
 * Teacher classroom management page.
 * Lists all classrooms and allows creating new ones.
 */
export default async function ClassroomPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const classrooms = await getTeacherClassrooms(session.user.id);

  // Serialize classroom data for the client component
  const classroomData = classrooms.map((c) => ({
    id: c.id,
    name: c.name,
    nameAr: c.nameAr,
    code: c.code,
    academicYear: c.academicYear,
    isActive: c.isActive ?? true,
    studentsCount: c.students.length,
    students: c.students.map((s) => ({
      id: s.id,
      displayName: s.displayName,
      displayNameAr: s.displayNameAr,
      joinedAt: s.joinedAt?.toISOString() ?? '',
      isActive: s.isActive ?? true,
    })),
    createdAt: c.createdAt?.toISOString() ?? '',
  }));

  return <ClassroomManagementView classrooms={classroomData} />;
}
