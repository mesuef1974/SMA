'use client';

import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LanguageSwitcher } from './language-switcher';
import { MOCK_TEACHERS } from '@/lib/mock-data';

export function DashboardHeader() {
  const t = useTranslations('dashboard');
  const teacher = MOCK_TEACHERS[0];

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="h-6" />

      <h1 className="text-sm font-medium truncate">{t('title')}</h1>

      <div className="ms-auto flex items-center gap-1">
        <LanguageSwitcher />

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('notifications')}
        >
          <Bell className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold"
            aria-hidden="true"
          >
            {teacher.name_ar.charAt(0)}
          </div>
          <span className="hidden text-sm font-medium sm:inline">{teacher.name_ar}</span>
        </div>
      </div>
    </header>
  );
}
