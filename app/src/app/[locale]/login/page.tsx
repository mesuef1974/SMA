'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/lib/auth-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
<<<<<<< Updated upstream
import { Logo } from '@/components/brand/Logo';
=======
import { LogoMark } from '@/components/brand/logo-mark';
>>>>>>> Stashed changes

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
<<<<<<< Updated upstream
          <div className="mx-auto mb-4 flex size-12 items-center justify-center">
            <Logo variant="color" size={48} />
          </div>
=======
          <LogoMark className="mx-auto mb-4 size-16 text-primary" />
>>>>>>> Stashed changes
          <CardTitle className="text-2xl font-bold">
            تسجيل الدخول
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            محلل الرياضيات الذكي — SMA
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

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
                autoComplete="current-password"
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

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'جارِ الدخول...' : 'دخول'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              سجّل كمعلم
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
