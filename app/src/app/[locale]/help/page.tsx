import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  BookOpen,
  GraduationCap,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import FeedbackForm from './feedback-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toArabicIndic } from '@/lib/numerals';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'help' });
  return { title: t('pageTitle') };
}

/**
 * Help / Quick Start Guide page.
 * Accessible to both authenticated and unauthenticated users.
 * Provides guidance for teachers and students on using SMA.
 */
export default async function HelpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'help' });
  const isArabic = locale === 'ar';

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-zinc-50 dark:bg-black"
    >
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {t('pageTitle')}
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            {t('pageSubtitle')}
          </p>
        </div>
      </header>

      {/* Content */}
      <main id="main-content" className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {/* Teacher Section */}
        <TeacherSection t={t} isArabic={isArabic} />

        {/* Student Section */}
        <StudentSection t={t} isArabic={isArabic} />

        {/* FAQ Section */}
        <FAQSection t={t} />

        {/* Contact / Feedback Section */}
        <FeedbackForm
          labels={{
            contact: t('contact'),
            contactDescription: t('contactDescription'),
            nameLabel: t('nameLabel'),
            typeLabel: t('typeLabel'),
            typeBug: t('typeBug'),
            typeSuggestion: t('typeSuggestion'),
            typeQuestion: t('typeQuestion'),
            messageLabel: t('messageLabel'),
            submitFeedback: t('submitFeedback'),
            feedbackSuccess: t('feedbackSuccess'),
            feedbackError: t('feedbackError'),
          }}
        />

        {/* Footer */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-400">
            {t('footerSupport')}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            {t('backToHome')}
          </Link>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helper: render an Arabic-Indic numbered step                       */
/* ------------------------------------------------------------------ */

interface StepProps {
  /** 1-based step index */
  index: number;
  /** Step text */
  text: string;
  /** Whether the locale is Arabic */
  isArabic: boolean;
}

/** Renders a single numbered step with Arabic-Indic numerals when appropriate. */
function Step({ index, text, isArabic }: StepProps) {
  const label = isArabic ? toArabicIndic(index) : String(index);
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {label}
      </span>
      <span className="pt-0.5">{text}</span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Teacher Section                                                     */
/* ------------------------------------------------------------------ */

interface SectionTranslations {
  t: Awaited<ReturnType<typeof getTranslations<'help'>>>;
  isArabic: boolean;
}

function TeacherSection({ t, isArabic }: SectionTranslations) {
  const prepareSteps = [
    t('teacher.prepare.step1'),
    t('teacher.prepare.step2'),
    t('teacher.prepare.step3'),
    t('teacher.prepare.step4'),
    t('teacher.prepare.step5'),
  ];

  const challengeSteps = [
    t('teacher.challenge.step1'),
    t('teacher.challenge.step2'),
    t('teacher.challenge.step3'),
    t('teacher.challenge.step4'),
    t('teacher.challenge.step5'),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BookOpen className="size-6 text-primary" />
          {t('teacher.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Login */}
        <div>
          <h3 className="mb-2 font-semibold">{t('teacher.loginTitle')}</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t('teacher.loginDesc')}
          </p>
        </div>

        {/* Dashboard overview */}
        <div>
          <h3 className="mb-2 font-semibold">{t('teacher.dashboardTitle')}</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t('teacher.dashboardDesc')}
          </p>
        </div>

        {/* Prepare a lesson */}
        <div>
          <h3 className="mb-2 font-semibold">{t('teacher.prepare.title')}</h3>
          <ol className="space-y-2 list-none ps-0">
            {prepareSteps.map((step, i) => (
              <Step key={i} index={i + 1} text={step} isArabic={isArabic} />
            ))}
          </ol>
        </div>

        {/* Create a live challenge */}
        <div>
          <h3 className="mb-2 font-semibold">{t('teacher.challenge.title')}</h3>
          <ol className="space-y-2 list-none ps-0">
            {challengeSteps.map((step, i) => (
              <Step key={i} index={i + 1} text={step} isArabic={isArabic} />
            ))}
          </ol>
        </div>

        {/* View report */}
        <div>
          <h3 className="mb-2 font-semibold">{t('teacher.reportTitle')}</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t('teacher.reportDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Student Section                                                     */
/* ------------------------------------------------------------------ */

function StudentSection({ t, isArabic }: SectionTranslations) {
  const joinSteps = [
    t('student.join.step1'),
    t('student.join.step2'),
    t('student.join.step3'),
    t('student.join.step4'),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <GraduationCap className="size-6 text-primary" />
          {t('student.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Join */}
        <div>
          <h3 className="mb-2 font-semibold">{t('student.join.title')}</h3>
          <ol className="space-y-2 list-none ps-0">
            {joinSteps.map((step, i) => (
              <Step key={i} index={i + 1} text={step} isArabic={isArabic} />
            ))}
          </ol>
        </div>

        {/* Solve exercises */}
        <div>
          <h3 className="mb-2 font-semibold">{t('student.exerciseTitle')}</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t('student.exerciseDesc')}
          </p>
        </div>

        {/* Join a challenge */}
        <div>
          <h3 className="mb-2 font-semibold">{t('student.challengeTitle')}</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t('student.challengeDesc')}
          </p>
        </div>

        {/* XP and badges */}
        <div>
          <h3 className="mb-2 font-semibold">{t('student.xpTitle')}</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t('student.xpDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ Section                                                         */
/* ------------------------------------------------------------------ */

function FAQSection({ t }: { t: SectionTranslations['t'] }) {
  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <HelpCircle className="size-6 text-primary" />
          {t('faq.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
              <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                {faq.q}
              </dt>
              <dd className="mt-1 text-zinc-600 dark:text-zinc-400">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
