'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function loginAction(
  _prevState: { error: string } | undefined,
  formData: FormData,
): Promise<{ error: string } | undefined> {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: (formData.get('callbackUrl') as string) || '/dashboard',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }
      return { error: 'حدث خطأ أثناء تسجيل الدخول' };
    }
    // NextAuth redirects throw a NEXT_REDIRECT error — rethrow it
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Register (teachers only)
// ---------------------------------------------------------------------------

export async function registerAction(
  _prevState: { error: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error: string; success?: boolean } | undefined> {
  const fullName = (formData.get('fullName') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // --- Validation ---
  if (!fullName || !email || !password || !confirmPassword) {
    return { error: 'جميع الحقول مطلوبة' };
  }

  if (password.length < 6) {
    return { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
  }

  if (password !== confirmPassword) {
    return { error: 'كلمتا المرور غير متطابقتين' };
  }

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: 'هذا البريد الإلكتروني مسجّل مسبقاً' };
  }

  // Hash password and insert
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    passwordHash,
    fullName,
    fullNameAr: fullName,
    role: 'teacher',
  });

  return { error: '', success: true };
}
