'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import {
  Home,
  BookOpen,
  FileText,
  Users,
  ClipboardCheck,
  AlertCircle,
  BarChart3,
  Settings,
  MessageCircle,
  GraduationCap,
  Trophy,
  Swords,
  HelpCircle,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/brand/Logo';

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { key: 'home', href: '/dashboard', icon: Home },
  { key: 'lessons', href: '/dashboard/lessons', icon: BookOpen },
  { key: 'lessonPlans', href: '/dashboard/lesson-plans', icon: FileText },
  { key: 'students', href: '/dashboard/students', icon: Users },
  { key: 'assessments', href: '/dashboard/assessments', icon: ClipboardCheck },
  { key: 'misconceptions', href: '/dashboard/misconceptions', icon: AlertCircle },
  { key: 'reports', href: '/dashboard/reports', icon: BarChart3 },
  { key: 'classrooms', href: '/dashboard/classroom', icon: GraduationCap },
  { key: 'leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
  { key: 'challenges', href: '/dashboard/challenges', icon: Swords },
];

const bottomNavItems: NavItem[] = [
  { key: 'aiChat', href: '/dashboard/ai-chat', icon: MessageCircle },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
  { key: 'help', href: '/help', icon: HelpCircle },
];

export function DashboardSidebar() {
  const t = useTranslations('sidebar');
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  }

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-lg"
          aria-label={t('home')}
        >
          <Logo variant="mono-white" size={32} />

          <span className="truncate group-data-[collapsible=icon]:hidden">SMA</span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            {t('home')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={t(item.key)}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="size-4" />
                    <span>{t(item.key)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton
                isActive={isActive(item.href)}
                tooltip={t(item.key)}
                render={<Link href={item.href} />}
              >
                <item.icon className="size-4" />
                <span>{t(item.key)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
