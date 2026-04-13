import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { ResultsView } from './results-view';

type Props = {
  params: Promise<{ locale: string; assessmentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'exercise' });
  return { title: t('resultsTitle') };
}

/**
 * Results page — server component.
 * Displays the exercise results passed via search params.
 * Public route — no auth required.
 */
export default async function ResultsPage({ params, searchParams }: Props) {
  const { locale, assessmentId } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  // Parse results data from search params
  let data = null;
  try {
    const raw = typeof sp.data === 'string' ? sp.data : '';
    if (raw) {
      data = JSON.parse(raw);
    }
  } catch {
    // If parsing fails, data remains null — the view will handle it
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <ResultsView
        data={data}
        assessmentId={assessmentId}
        locale={locale}
      />
    </div>
  );
}
