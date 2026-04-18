'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, HelpCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface StudentDashboardViewProps {
  studentName: string;
  className: string;
}

/**
 * Client view for the student dashboard.
 * Displays welcome message, class info, and a placeholder for exercises.
 */
export function StudentDashboardView({
  studentName,
  className,
}: StudentDashboardViewProps) {
  const t = useTranslations('student');

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              م
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {t('welcomeStudent', { name: studentName })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('yourClass', { className })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/help"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              <HelpCircle className="size-4" />
              <span>{t('help')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main id="main-content" className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Exercises placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5" />
                {t('dashboardTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <BookOpen className="size-8 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg">
                  {t('exercisesPlaceholder')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
