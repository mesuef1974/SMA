'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getClassroomByCode, joinClassroom } from '@/db/queries';
import { getLocale } from 'next-intl/server';

/**
 * Server action: validate class code, enroll the student,
 * store studentId in a cookie, and redirect to the student dashboard.
 */
export async function joinClassAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const code = (formData.get('code') as string)?.trim().toUpperCase();
  const displayName = (formData.get('displayName') as string)?.trim();
  const locale = await getLocale();

  // --- Validation ---
  if (!code) {
    return { error: locale === 'ar' ? 'الرجاء إدخال كود الصف' : 'Please enter the class code' };
  }

  if (code.length !== 6) {
    return { error: locale === 'ar' ? 'كود الصف يجب أن يكون 6 أحرف' : 'Class code must be 6 characters' };
  }

  if (!displayName) {
    return { error: locale === 'ar' ? 'الرجاء إدخال اسمك' : 'Please enter your name' };
  }

  // --- Lookup classroom ---
  const classroom = await getClassroomByCode(code);

  if (!classroom || !classroom.isActive) {
    return { error: locale === 'ar' ? 'كود الصف غير صحيح أو غير نشط' : 'Invalid or inactive class code' };
  }

  // --- Enroll student ---
  try {
    const student = await joinClassroom(
      classroom.id,
      displayName,
      displayName, // displayNameAr — same as displayName since the student enters one name
    );

    // Store student session in a cookie (no auth needed)
    const cookieStore = await cookies();
    cookieStore.set('studentId', student.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    cookieStore.set('classroomId', classroom.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  } catch {
    return { error: locale === 'ar' ? 'حدث خطأ أثناء الانضمام. حاول مرة أخرى' : 'An error occurred while joining. Please try again' };
  }

  // Build locale-aware redirect path
  const prefix = locale === 'ar' ? '' : `/${locale}`;
  redirect(`${prefix}/student/dashboard`);
}
