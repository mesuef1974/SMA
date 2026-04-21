import { setRequestLocale } from "next-intl/server";
import { ComposerShell } from "./composer-shell";

type Props = {
  params: Promise<{ locale: string }>;
};

// Teacher UI v2 — Lesson Composer (design-handoff).
// TODO(integration): wire POST /api/teacher/lesson-plans + auto-save every 3s.
export default async function LessonComposerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ComposerShell />;
}

export const metadata = {
  title: "محرّر خطة درس — SMA",
};
