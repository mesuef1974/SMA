import { setRequestLocale, getTranslations } from 'next-intl/server';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboardStubs' });
  return { title: t('lessonPlans.title') };
}

export default async function LessonPlansStubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'dashboardStubs' });
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="size-6 text-primary" aria-hidden="true" />
          {t('lessonPlans.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{t('lessonPlans.comingSoon')}</p>
      </CardContent>
    </Card>
  );
}
