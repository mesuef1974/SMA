import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLessonById, getLessonPlansByTeacher } from "@/db/queries";
import { ComposerShell, type ComposerLessonSeed } from "./composer-shell";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ lessonId?: string }>;
};

// Teacher UI v2 — Lesson Composer (design-handoff).
//
// P0.5 (2026-04-22) — wired to real data:
//   • Reads `lessonId` from the query string.
//   • If present, fetches the lesson (+ chapter + learning outcomes) and
//     the teacher's most-recent plan for that lesson to seed the editor.
//   • If absent, ComposerShell renders an empty state that links to the
//     lessons list so the teacher can pick one.
// Save/publish buttons currently show a "coming soon" toast — no generic
// persistence endpoint exists yet (only /api/lesson-plans/generate which
// runs the full AI pipeline). Tracked as a follow-up.
export default async function LessonComposerPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { lessonId } = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  let seed: ComposerLessonSeed | null = null;
  if (lessonId) {
    const [lesson, teacherPlans] = await Promise.all([
      getLessonById(lessonId),
      getLessonPlansByTeacher(session.user.id),
    ]);
    if (lesson) {
      const priorPlan = teacherPlans
        .filter((p) => p.lessonId === lessonId)
        .sort((a, b) => {
          const at = a.createdAt?.getTime() ?? 0;
          const bt = b.createdAt?.getTime() ?? 0;
          return bt - at;
        })[0];

      seed = {
        lessonId: lesson.id,
        titleAr: lesson.titleAr ?? lesson.title ?? "درس بدون عنوان",
        titleEn: lesson.title ?? null,
        lessonNumber: lesson.number ?? null,
        periodCount: lesson.periodCount ?? 2,
        chapter: lesson.chapter
          ? {
              number: lesson.chapter.number,
              titleAr: lesson.chapter.titleAr,
            }
          : null,
        learningOutcomes: (lesson.learningOutcomes ?? []).map((lo) => ({
          code: lo.code ?? null,
          descriptionAr: lo.descriptionAr,
          bloomLevel: lo.bloomLevel ?? null,
        })),
        priorPlan: priorPlan
          ? {
              id: priorPlan.id,
              periodNumber: priorPlan.periodNumber ?? null,
              status: priorPlan.status ?? null,
              sectionData: priorPlan.sectionData ?? null,
            }
          : null,
      };
    }
  }

  return <ComposerShell seed={seed} locale={locale} />;
}

export const metadata = {
  title: "محرّر خطة درس — SMA",
};
