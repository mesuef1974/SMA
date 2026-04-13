'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('a11y');

  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  const label = locale === 'ar' ? 'English' : 'العربية';

  function switchLocale() {
    router.replace(pathname, { locale: otherLocale });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      aria-label={t('languageSwitch')}
      className="gap-1.5"
    >
      <Globe className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
