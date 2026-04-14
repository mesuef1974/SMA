import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Root-level 404 page.
 *
 * Next.js resolves fall-through 404s from the nearest `not-found.tsx` above
 * the unmatched segment. With `localePrefix: 'as-needed'`, the proxy rewrites
 * `/ar/*` to `/*` before routing, so unmatched routes under the default
 * locale bypass `[locale]/not-found.tsx` and hit the root. This file keeps
 * the SMA-branded 404 visible for those cases.
 */
export default async function RootNotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'notFound' });

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="flex min-h-[60vh] items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mb-6 text-muted-foreground">{t('body')}</p>
        <Button render={<Link href="/dashboard" />} className="gap-1.5">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('cta')}
        </Button>
      </div>
    </div>
  );
}
