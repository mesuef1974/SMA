'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { createClassroom } from '@/db/queries';
import { getLocale } from 'next-intl/server';

/**
 * Generate a random 6-character uppercase alphanumeric code.
 * Excludes confusing characters (0, O, I, l) for readability on projectors.
 */
function generateClassCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Server action: create a new classroom with a random code.
 * Requires the teacher to be authenticated.
 */
export async function createClassroomAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const locale = await getLocale();
  const session = await auth();

  if (!session?.user?.id) {
    return { error: locale === 'ar' ? 'يجب تسجيل الدخول أولا' : 'You must be logged in' };
  }

  const name = (formData.get('name') as string)?.trim();
  const nameAr = (formData.get('nameAr') as string)?.trim();
  const academicYear = (formData.get('academicYear') as string)?.trim();

  // --- Validation ---
  if (!name) {
    return { error: locale === 'ar' ? 'الرجاء إدخال اسم الصف' : 'Please enter the class name' };
  }
  if (!nameAr) {
    return { error: locale === 'ar' ? 'الرجاء إدخال اسم الصف بالعربية' : 'Please enter the class name in Arabic' };
  }
  if (!academicYear) {
    return { error: locale === 'ar' ? 'الرجاء إدخال السنة الدراسية' : 'Please enter the academic year' };
  }

  try {
    const code = generateClassCode();

    await createClassroom({
      teacherId: session.user.id,
      name,
      nameAr,
      code,
      academicYear,
    });

    revalidatePath('/dashboard/classroom');
    return { success: true };
  } catch {
    return { error: locale === 'ar' ? 'حدث خطأ أثناء إنشاء الصف' : 'An error occurred while creating the classroom' };
  }
}
