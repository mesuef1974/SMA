import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardFooter } from '@/components/dashboard/dashboard-footer';
import { auth } from '@/lib/auth';
import { isAdvisor } from '@/lib/advisor';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  return { title: t('title') };
}

export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const advisor = isAdvisor(session);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <DashboardSidebar isAdvisor={advisor} />
        <SidebarInset>
          <DashboardHeader userName={session?.user?.name} />
          <main id="main-content" className="flex-1 overflow-y-auto">
            {children}
          </main>
          <DashboardFooter />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
