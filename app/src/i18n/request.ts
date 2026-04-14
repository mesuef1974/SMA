import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that the incoming locale is supported
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Founder requirement 2026-04-14: pin every number format to Latin
    // digits (0-9) regardless of locale. Locks in `numberingSystem: 'latn'`
    // at the next-intl layer so `t.number()` calls cannot leak Arabic-Indic
    // glyphs into the UI even when the locale is `ar`.
    formats: {
      number: {
        default: { numberingSystem: 'latn' },
        percent: { numberingSystem: 'latn', style: 'percent', maximumFractionDigits: 0 },
        decimal: { numberingSystem: 'latn', style: 'decimal' },
      },
    },
  };
});
