'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';

const MathRenderer = dynamic(
  () => import('@/components/math/MathRenderer').then((mod) => ({ default: mod.MathRenderer })),
  {
    ssr: false,
    loading: () => (
      <div className="h-12 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    ),
  },
);

/**
 * Client component for the home page content.
 * Extracted from page.tsx to allow `next/dynamic` with `ssr: false`.
 */
export function HomeContent() {
  const t = useTranslations();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main
        id="main-content"
        role="main"
        aria-label={t('a11y.mainContent')}
        className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-10 py-32 px-8"
      >
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('app.title')} — {t('app.subtitle')}
        </h1>

        <p className="max-w-xl text-center text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {t('app.description')}
          <br />
          {t('app.tagline')}
        </p>

        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {t('math.exampleLabel')}
          </p>
          <div className="flex items-center justify-center text-xl">
            <MathRenderer
              math="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              display
            />
          </div>
        </div>
      </main>
    </div>
  );
}
