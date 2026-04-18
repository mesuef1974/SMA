'use client';

import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LanguageSwitcher } from './language-switcher';
import { SignOutButton } from './sign-out-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const t = useTranslations('dashboard');
  const displayName = userName ?? '';
  const initial = displayName.charAt(0) || '?';

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur-sm">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="h-5 opacity-30" />
      <span className="text-sm font-semibold text-foreground">{t('title')}</span>

      <div className="ms-auto flex items-center gap-1">
        <ThemeToggle />
        <LanguageSwitcher />
        <Button variant="ghost" size="icon-sm" aria-label={t('notifications')}>
          <Bell className="size-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-5 opacity-30" />
        <div
          className="flex size-7 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: 'var(--sma-najm-700)', color: 'white' }}
          aria-hidden="true"
        >
          {initial}
        </div>
        <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
