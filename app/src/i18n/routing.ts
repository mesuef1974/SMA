import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'] as const,
  defaultLocale: 'ar',
  localePrefix: 'as-needed',
});

export type AppLocale = (typeof routing.locales)[number];
