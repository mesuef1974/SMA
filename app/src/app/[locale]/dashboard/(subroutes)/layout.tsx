import { setRequestLocale } from 'next-intl/server';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

// Legacy route group for dashboard subroutes (lessons, classroom, advisor, …).
// The unified Chrome shell is provided by the parent layout at
// `src/app/[locale]/dashboard/layout.tsx`, so this layout is now a thin
// pass-through that only forwards the locale to next-intl and adds scroll
// container semantics for the main content area.
export default async function DashboardSubroutesLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div className="flex-1 overflow-y-auto">{children}</div>;
}
