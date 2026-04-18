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

const teachingNavItems: NavItem[] = [
  { key: 'home', href: '/dashboard', icon: Home },
  { key: 'lessons', href: '/dashboard/lessons', icon: BookOpen },
  { key: 'lessonPlans', href: '/dashboard/lesson-plans', icon: FileText },
  { key: 'challenges', href: '/dashboard/challenges', icon: Swords },
];

const studentsNavItems: NavItem[] = [
  { key: 'students', href: '/dashboard/students', icon: Users },
  { key: 'classrooms', href: '/dashboard/classroom', icon: GraduationCap },
  { key: 'leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
];

const analyticsNavItems: NavItem[] = [
  { key: 'assessments', href: '/dashboard/assessments', icon: ClipboardCheck },
  { key: 'misconceptions', href: '/dashboard/misconceptions', icon: AlertCircle },
  { key: 'reports', href: '/dashboard/reports', icon: BarChart3 },
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
    <Sidebar side="right" collapsible="icon" className="border-s-0 bg-[var(--sma-najm-950)]">
      <SidebarHeader className="border-b border-white/10 p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-lg"
          aria-label={t('home')}
        >
          <Logo variant="mono-white" size={32} />

          <span className="truncate group-data-[collapsible=icon]:hidden text-white font-bold">أذكياء SMA</span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-xs uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            {t('groupTeaching')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teachingNavItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={t(item.key)}
                    render={<Link href={item.href} />}
                    className="text-white/70 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/15 data-[active=true]:text-white rounded-lg"
                  >
                    <item.icon className="size-4" />
                    <span>{t(item.key)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-xs uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            {t('groupStudents')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studentsNavItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={t(item.key)}
                    render={<Link href={item.href} />}
                    className="text-white/70 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/15 data-[active=true]:text-white rounded-lg"
                  >
                    <item.icon className="size-4" />
                    <span>{t(item.key)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-xs uppercase tracking-wider group-data-[collapsible=icon]:hidden">
            {t('groupAnalytics')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsNavItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={t(item.key)}
                    render={<Link href={item.href} />}
                    className="text-white/70 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/15 data-[active=true]:text-white rounded-lg"
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

      <SidebarFooter className="border-t border-white/10 p-2">
        <SidebarSeparator />
        <SidebarMenu>
          {bottomNavItems.map((item) => (
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton
                isActive={isActive(item.href)}
                tooltip={t(item.key)}
                render={<Link href={item.href} />}
                className="text-white/70 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/15 data-[active=true]:text-white rounded-lg"
              >
                <item.icon className="size-4" />
                <span>{t(item.key)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="mt-2 flex items-center gap-2 rounded-lg p-2 text-white/60 text-xs group-data-[collapsible=icon]:justify-center">
          <div className="size-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white shrink-0">م</div>
          <span className="truncate group-data-[collapsible=icon]:hidden">معلم الرياضيات</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
