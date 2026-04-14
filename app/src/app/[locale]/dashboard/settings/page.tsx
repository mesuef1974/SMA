import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboardStubs' });
  return { title: t('settings.title') };
}

export default async function SettingsStubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'dashboardStubs' });
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Settings className="size-6 text-primary" aria-hidden="true" />
          {t('settings.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{t('settings.comingSoon')}</p>
      </CardContent>
    </Card>
  );
}
