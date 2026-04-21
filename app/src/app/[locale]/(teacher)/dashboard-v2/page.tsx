import { setRequestLocale } from "next-intl/server";
import { DashboardShell } from "./dashboard-shell";

type Props = {
  params: Promise<{ locale: string }>;
};

// Teacher UI v2 — new Bento dashboard (design-handoff).
// This route lives alongside the legacy /[locale]/dashboard; both remain working.
// TODO(integration): wire `/api/teacher/dashboard` and session auth here when ready.
export default async function TeacherDashboardV2({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardShell localePath={`/${locale}`} />;
}

export const metadata = {
  title: "لوحة المعلم — نسخة v2",
};
