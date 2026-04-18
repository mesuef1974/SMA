'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/lib/auth-actions';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/Logo';
import { AzkiaLogo } from '@/components/brand/AzkiaLogo';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row-reverse" dir="rtl">

      {/* ── الجانب الأيمن: Brand Hero ── */}
      <div
        className="relative flex flex-col items-center justify-center gap-8 p-8 lg:w-1/2 lg:p-16"
        style={{
          background: 'linear-gradient(135deg, var(--sma-najm-950) 0%, var(--sma-najm-800) 60%, var(--sma-najm-700) 100%)',
        }}
      >
        {/* شبكة خلفية خفية */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* المحتوى */}
        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          {/* SMA | mark | محلل الرياضيات الذكي */}
          <div className="flex flex-col items-center gap-3">
            <Logo variant="mono-white" size={64} />
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold tracking-widest text-white">SMA</span>
              <span className="text-white/30">|</span>
              <span className="text-base font-medium text-white/80">محلل الرياضيات الذكي</span>
            </div>
          </div>

          {/* ثلاث ميزات */}
          <div className="mt-4 flex flex-col gap-3 text-right">
            {[
              { icon: '🎯', text: 'تحضير الدروس بذكاء اصطناعي' },
              { icon: '📊', text: 'رصد المفاهيم الخاطئة فورياً' },
              { icon: '⚡', text: 'تحديات حية بين الفرق' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-medium text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* شعار الشركة */}
        <div className="relative z-10 mt-auto opacity-50">
          <AzkiaLogo variant="white" markSize={28} />
        </div>
      </div>

      {/* ── الجانب الأيسر: نموذج الدخول ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-8 lg:p-16">
        <div className="w-full max-w-sm">

          {/* رأس النموذج */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">مرحباً بعودتك</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              سجّل الدخول للوصول إلى منصتك التعليمية
            </p>
          </div>

          {/* النموذج */}
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                البريد الإلكتروني
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="teacher@sma.qa"
                required
                autoComplete="email"
                dir="ltr"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  كلمة المرور
                </label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                dir="ltr"
                className="h-11 text-base"
              />
            </div>

            {state?.error && (
              <div
                className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{state.error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--sma-najm-700) 0%, var(--sma-najm-900) 100%)' }}
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  جارِ الدخول...
                </span>
              ) : (
                'دخول إلى المنصة'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="font-medium hover:underline" style={{ color: 'var(--sma-najm-700)' }}>
              سجّل كمعلم
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
