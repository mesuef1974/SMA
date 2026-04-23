import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

import { auth } from '@/lib/auth';
import { getTeacherClassrooms, getClassPerformance } from '@/db/queries';
import { StudentsView } from './students-view';

// ---------------------------------------------------------------------------
// Teacher: Student Performance View
// /[locale]/dashboard/students
// Requires teacher authentication.
// Shows student list with performance stats for the teacher's first classroom.
// ---------------------------------------------------------------------------

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'teacherStudents' });
  return { title: t('title') };
}

export default async function TeacherStudentsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const teacherId = session.user.id;

  // Get teacher's classrooms
  const classrooms = await getTeacherClassrooms(teacherId);

  if (classrooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">
          {locale === 'ar'
            ? 'لا توجد فصول دراسية. أنشئ فصلاً أولاً.'
            : 'No classrooms found. Create a classroom first.'}
        </p>
      </div>
    );
  }

  // Use the first active classroom
  const classroom = classrooms[0];
  const classPerformance = await getClassPerformance(classroom.id);

  return (
    <StudentsView
      classroomName={classroom.name}
      classroomNameAr={classroom.nameAr}
      students={classPerformance.students.map((s) => ({
        id: s.id,
        displayName: s.displayName,
        displayNameAr: s.displayNameAr,
        totalExercises: s.totalExercises,
        correctExercises: s.correctExercises,
        accuracyRate: s.accuracyRate,
        totalMisconceptions: s.totalMisconceptions,
        unresolvedMisconceptions: s.unresolvedMisconceptions,
      }))}
      commonMisconceptions={classPerformance.commonMisconceptions.map((mc) => ({
        code: mc.code,
        nameAr: mc.nameAr,
        name: mc.name,
        severity: mc.severity,
        remediationHintAr: mc.remediationHintAr,
        occurrences: mc.occurrences,
      }))}
      classStats={classPerformance.classStats}
    />
  );
}
