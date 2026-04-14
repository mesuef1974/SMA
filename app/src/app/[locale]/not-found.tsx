import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Localized 404 page for routes under the [locale] segment.
 * Rendered by Next.js when a nested route is not matched.
 */
export default async function LocalizedNotFound() {
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
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t('title')}
        </h1>
        <p className="mb-6 text-muted-foreground">{t('body')}</p>
        <Button render={<Link href="/dashboard" />} className="gap-1.5">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('cta')}
        </Button>
      </div>
    </div>
  );
}
