'use client';

import { useActionState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';
import { registerAction } from '@/lib/auth-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push('/login');
    }
  }, [state?.success, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold">
            م
          </div>
          <CardTitle className="text-2xl font-bold">
            تسجيل معلم جديد
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            أنشئ حسابك في محلل الرياضيات الذكي
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="أ. سفيان"
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="teacher@sma.qa"
                required
                autoComplete="email"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                dir="ltr"
              />
            </div>

            {state?.error && (
              <div
                className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {state.error}
              </div>
            )}

            {state?.success && (
              <div className="rounded-md bg-green-100 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400">
                تم إنشاء الحساب بنجاح! جارِ التحويل لتسجيل الدخول...
              </div>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'جارِ التسجيل...' : 'إنشاء حساب'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              سجّل دخولك
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
