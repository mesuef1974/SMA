import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

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

  return (
    <TooltipProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
