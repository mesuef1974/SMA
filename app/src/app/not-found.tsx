import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Root-level 404 page for unmatched URLs across the whole app.
 *
 * Next.js renders the root `not-found.tsx` inside the root `app/layout.tsx`
 * ONLY — it does NOT wrap with `[locale]/layout.tsx`, so there is no
 * `NextIntlClientProvider` in scope here. This file therefore cannot use
 * `next-intl`'s navigation `Link` or client hooks; doing so throws
 * "No intl context found" and Next.js converts the response to
 * `__next_error__` with HTTP 500 — which was exactly the bug that made
 * browsers show their own interstitial instead of our branded 404.
 *
 * Since `defaultLocale: 'ar'`, hardcoding Arabic strings is acceptable:
 * localized routes (`/en/*`, `/ar/*`) fall through to
 * `[locale]/not-found.tsx`, which DOES have the intl provider.
 */
export default function RootNotFound() {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-[60vh] items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          الصفحة غير موجودة
        </h1>
        <p className="mb-6 text-muted-foreground">
          عذراً، الصفحة التي تبحث عنها غير متوفرة.
        </p>
        <Button render={<Link href="/dashboard" />} className="gap-1.5">
          <ArrowLeft className="size-4" aria-hidden="true" />
          العودة للوحة التحكم
        </Button>
      </div>
    </div>
  );
}
