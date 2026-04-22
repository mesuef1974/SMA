"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Sparkles,
  Save,
  Upload,
  GripVertical,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { Chrome } from "@/components/teacher-ui";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Lesson Composer — sidebar outline + main editor.
//
// P0.5 (2026-04-22):
//   • Data now flows from the server component (page.tsx) via `seed`.
//   • Previously the whole editor was a mock with biology sample content
//     ("كيف يتضاعف عدد خلايا البكتيريا") on a math lesson — removed.
//   • If no `lessonId` is supplied we show a friendly empty state that
//     deep-links to /dashboard/lessons for lesson selection.
//   • Save / publish are TODO stubs backed by an inline toast banner —
//     no generic POST endpoint exists yet (only AI generation / template
//     routes). The banner tells the teacher "جارٍ الحفظ... (قيد التطوير)".
// ---------------------------------------------------------------------------

type Section = {
  id: string;
  title: string;
  minutes: number;
  body: string;
};

export type ComposerLessonSeed = {
  lessonId: string;
  titleAr: string;
  titleEn: string | null;
  lessonNumber: string | null;
  periodCount: number;
  chapter: { number: number; titleAr: string } | null;
  learningOutcomes: Array<{
    code: string | null;
    descriptionAr: string;
    bloomLevel: string | null;
  }>;
  priorPlan: {
    id: string;
    periodNumber: number | null;
    status: string | null;
    sectionData: unknown;
  } | null;
};

type PlanSectionShape = {
  teacher_minutes?: number;
  student_minutes?: number;
  activity_ar?: string;
  concept_ar?: string;
  challenge_ar?: string;
};

type PriorPlanShape = {
  warm_up?: PlanSectionShape;
  explore?: PlanSectionShape;
  explain?: PlanSectionShape;
  practice?: { teacher_minutes?: number; student_minutes?: number };
  assess?: { teacher_minutes?: number; student_minutes?: number };
  extend?: PlanSectionShape;
};

// Default section skeleton — generic math placeholders, no subject bleed.
const DEFAULT_SECTIONS: Section[] = [
  {
    id: "warmup",
    title: "تهيئة وتحفيز",
    minutes: 5,
    body: "سؤال محفّز يربط الدرس بخبرة سابقة للطلاب.",
  },
  {
    id: "concept",
    title: "المفهوم الأساسي",
    minutes: 12,
    body: "شرح المفهوم الرياضي الأساسي مع الأمثلة والرموز.",
  },
  {
    id: "activity",
    title: "نشاط تطبيقي",
    minutes: 18,
    body: "حل أمثلة متدرجة، مع مناقشة جماعية وتغذية راجعة.",
  },
  {
    id: "assessment",
    title: "تقييم سريع",
    minutes: 7,
    body: "اختبار قصير من 4 أسئلة موزّعة على مستويات بلوم.",
  },
  {
    id: "closure",
    title: "إغلاق",
    minutes: 3,
    body: "تلخيص الفكرة الرئيسية + واجب منزلي أو رابط فيديو.",
  },
];

function secondsFrom(section: PlanSectionShape | undefined): number {
  const t = section?.teacher_minutes ?? 0;
  const s = section?.student_minutes ?? 0;
  return t + s;
}

function truncate(s: string | undefined, max = 240): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function sectionsFromPrior(prior: PriorPlanShape): Section[] {
  const get = (k: keyof PriorPlanShape) =>
    prior[k] as PlanSectionShape | undefined;
  const result: Section[] = [];
  const warm = get("warm_up");
  if (warm)
    result.push({
      id: "warmup",
      title: "تهيئة وتحفيز",
      minutes: secondsFrom(warm) || 5,
      body: truncate(warm.activity_ar),
    });
  const explore = get("explore");
  if (explore)
    result.push({
      id: "explore",
      title: "استكشاف",
      minutes: secondsFrom(explore) || 10,
      body: truncate(explore.activity_ar),
    });
  const explain = get("explain");
  if (explain)
    result.push({
      id: "explain",
      title: "شرح المفهوم",
      minutes: secondsFrom(explain) || 12,
      body: truncate(explain.concept_ar),
    });
  const practice = prior.practice;
  if (practice)
    result.push({
      id: "practice",
      title: "تطبيق",
      minutes: (practice.teacher_minutes ?? 0) + (practice.student_minutes ?? 0) || 15,
      body: "تمارين متدرجة على المفهوم.",
    });
  const assess = prior.assess;
  if (assess)
    result.push({
      id: "assess",
      title: "تقييم",
      minutes: (assess.teacher_minutes ?? 0) + (assess.student_minutes ?? 0) || 7,
      body: "أسئلة تقييم ختامية موزّعة على بلوم.",
    });
  const extend = get("extend");
  if (extend)
    result.push({
      id: "extend",
      title: "إثراء (اختياري)",
      minutes: secondsFrom(extend) || 5,
      body: truncate(extend.challenge_ar),
    });
  return result.length > 0 ? result : DEFAULT_SECTIONS;
}

// ---------------------------------------------------------------------------
// Empty state — no lessonId in query string
// ---------------------------------------------------------------------------

function EmptyComposerState({ locale }: { locale: string }) {
  return (
    <Chrome activeTab="lessons">
      <div className="max-w-[820px] mx-auto px-7 py-16">
        <div className="bg-card border border-border rounded-[20px] p-10 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <BookOpen className="size-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            اختر درساً للبدء
          </h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            لم يتم تحديد درس بعد. اختر درساً من قائمة الدروس لبدء تحضير خطة جديدة
            أو تعديل خطة قائمة.
          </p>
          <Link
            href={`/${locale}/dashboard/lessons`}
            className="inline-flex items-center gap-2 h-[40px] px-5 rounded-[10px] text-white text-sm font-semibold shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, var(--sma-najm-700) 0%, var(--sma-sahla-600) 100%)",
            }}
          >
            <ArrowLeft size={16} /> تصفّح الدروس
          </Link>
        </div>
      </div>
    </Chrome>
  );
}

// ---------------------------------------------------------------------------
// Main shell
// ---------------------------------------------------------------------------

export function ComposerShell({
  seed,
  locale,
}: {
  seed: ComposerLessonSeed | null;
  locale: string;
}) {
  if (!seed) {
    return <EmptyComposerState locale={locale} />;
  }
  return <ComposerShellBody seed={seed} locale={locale} />;
}

function ComposerShellBody({
  seed,
  locale,
}: {
  seed: ComposerLessonSeed;
  locale: string;
}) {
  const initialSections = seed.priorPlan?.sectionData
    ? sectionsFromPrior(seed.priorPlan.sectionData as PriorPlanShape)
    : DEFAULT_SECTIONS;

  const [sections, setSections] = React.useState<Section[]>(initialSections);
  const [activeId, setActiveId] = React.useState<string>(initialSections[0].id);
  const [title, setTitle] = React.useState(seed.titleAr);
  const [toast, setToast] = React.useState<string | null>(null);

  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const total = sections.reduce((s, x) => s + x.minutes, 0);

  const flashToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  const addSection = () => {
    const id = `sec-${Date.now()}`;
    setSections((list) => [
      ...list,
      { id, title: "قسم جديد", minutes: 5, body: "" },
    ]);
    setActiveId(id);
  };

  const patchActive = (patch: Partial<Section>) => {
    setSections((list) =>
      list.map((s) => (s.id === active.id ? { ...s, ...patch } : s)),
    );
  };

  const handleSaveDraft = () => {
    // TODO(integration): POST to a dedicated draft endpoint once it exists.
    // For now we only have /api/lesson-plans/generate which runs the full
    // AI pipeline, so a blind "save" would overwrite teacher edits.
    flashToast("جارٍ الحفظ... (ربط الحفظ قيد التطوير)");
  };

  const handlePublish = () => {
    // TODO(integration): mark plan as in_review + notify advisor.
    flashToast("نشر للطلاب قيد التطوير — سيتوفر قريباً");
  };

  const chapterLabel = seed.chapter
    ? `الفصل ${seed.chapter.number} — ${seed.chapter.titleAr}`
    : "";

  return (
    <Chrome activeTab="lessons">
      <div className="max-w-[1440px] mx-auto px-7 py-7">
        {/* header row */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">
              خطة درس — مسودة
              {seed.priorPlan?.status ? ` · ${seed.priorPlan.status}` : ""}
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-heading text-[28px] font-bold text-foreground leading-tight bg-transparent border-0 outline-none focus:ring-2 focus:ring-ring rounded-md px-1 -mx-1"
              aria-label="عنوان الدرس"
            />
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {seed.lessonNumber && <Chip>درس {seed.lessonNumber}</Chip>}
              {chapterLabel && <Chip>{chapterLabel}</Chip>}
              <Chip>
                {seed.periodCount} حصّة
              </Chip>
              <Chip>
                <span className="font-numeric tabular-nums">{total}</span> دقيقة
              </Chip>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/dashboard/lessons/${seed.lessonId}/prepare`}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-border bg-card text-foreground text-xs font-medium hover:border-primary/60"
            >
              <Sparkles size={14} /> توليد بالذكاء الاصطناعي
            </Link>
          </div>
        </div>

        {/* learning outcomes strip (read-only) */}
        {seed.learningOutcomes.length > 0 && (
          <div className="bg-muted/40 border border-border rounded-[14px] p-3 mb-4">
            <div className="text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
              مخرجات التعلم
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] text-foreground">
              {seed.learningOutcomes.slice(0, 6).map((lo, i) => (
                <li key={i} className="flex items-start gap-2">
                  {lo.code && (
                    <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">
                      {lo.code}
                    </span>
                  )}
                  <span className="flex-1">{lo.descriptionAr}</span>
                  {lo.bloomLevel && (
                    <span className="text-[10px] text-primary/80 shrink-0">
                      {lo.bloomLevel}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* sidebar + main */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3.5">
          <aside className="bg-card border border-border rounded-[16px] p-3 h-fit lg:sticky lg:top-[120px]">
            <div className="flex items-center justify-between px-2 py-1.5 mb-1">
              <span className="text-[11px] font-semibold text-muted-foreground tracking-wide">
                المخطط
              </span>
              <span className="text-[10px] text-muted-foreground font-numeric tabular-nums">
                {sections.length} أقسام
              </span>
            </div>
            <ul className="flex flex-col gap-1">
              {sections.map((s, i) => {
                const isActive = s.id === activeId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(s.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-2 rounded-[10px] text-start transition-colors",
                        isActive
                          ? "bg-primary/10 text-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <GripVertical
                        size={14}
                        className="text-muted-foreground/60 shrink-0"
                      />
                      <span className="font-numeric tabular-nums text-xs w-5 shrink-0 text-muted-foreground">
                        {i + 1}.
                      </span>
                      <span className="flex-1 text-[13px] font-medium truncate">
                        {s.title}
                      </span>
                      <span className="font-numeric tabular-nums text-[10px] text-muted-foreground shrink-0">
                        {s.minutes}′
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={addSection}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 h-[34px] rounded-[10px] border border-dashed border-border text-muted-foreground text-xs hover:border-primary hover:text-primary transition-colors"
            >
              <Plus size={14} /> إضافة قسم
            </button>
          </aside>

          <section className="bg-card border border-border rounded-[16px] p-6 min-h-[520px]">
            <div className="flex items-center gap-2 mb-4">
              <input
                value={active.title}
                onChange={(e) => patchActive({ title: e.target.value })}
                className="flex-1 font-heading text-xl font-bold text-foreground bg-transparent border-0 outline-none focus:ring-2 focus:ring-ring rounded-md px-1 -mx-1"
                aria-label="عنوان القسم"
              />
              <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                مدة
                <input
                  type="number"
                  min={1}
                  value={active.minutes}
                  onChange={(e) =>
                    patchActive({ minutes: Number(e.target.value) || 0 })
                  }
                  className="w-16 h-8 rounded-md border border-border bg-background font-numeric tabular-nums text-center text-sm"
                />
                <span>دقيقة</span>
              </label>
            </div>

            <ComposerField
              label="الأهداف (بلوم)"
              placeholder="1. يُعرّف الطالب… 2. يطبّق الطالب…"
            />
            <ComposerField
              label="المواد والأدوات"
              placeholder="جهاز عرض، ورقة عمل، GeoGebra…"
            />

            <div className="mb-4">
              <div className="text-[11px] font-semibold text-primary tracking-wide mb-1.5">
                المحتوى
              </div>
              <textarea
                value={active.body}
                onChange={(e) => patchActive({ body: e.target.value })}
                rows={6}
                className="w-full rounded-[12px] border border-border bg-background p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring resize-y"
                placeholder="اكتب شرح الدرس هنا…"
              />
            </div>

            <ComposerField
              label="التقييم"
              placeholder="اختبار قصير من 4 أسئلة متعدد المستويات…"
            />
            <ComposerField
              label="الواجب"
              placeholder="مسائل من الكتاب، ص …"
            />
          </section>
        </div>

        {/* sticky bottom bar */}
        <div className="sticky bottom-4 mt-5 flex justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 backdrop-blur-md px-2 py-2 shadow-md">
            <span className="text-[11px] text-muted-foreground pe-2">
              {seed.priorPlan
                ? `مسودة قائمة · `
                : `مسودة جديدة · `}
              <span className="font-numeric tabular-nums">{total}</span> دقيقة
            </span>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-border bg-transparent text-foreground text-xs font-medium hover:border-primary/60"
            >
              <Save size={14} /> حفظ كمسودة
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 h-[34px] px-4 rounded-[10px] text-white text-xs font-semibold shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, var(--sma-najm-700) 0%, var(--sma-sahla-600) 100%)",
              }}
            >
              <Upload size={14} /> نشر للطلاب
            </button>
          </div>
        </div>

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-2 rounded-full text-xs shadow-lg"
          >
            {toast}
          </div>
        )}
      </div>
    </Chrome>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
      {children}
    </span>
  );
}

function ComposerField({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  const [value, setValue] = React.useState("");
  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold text-primary tracking-wide mb-1.5">
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-[12px] border border-border bg-background p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring resize-y"
      />
    </div>
  );
}

export default ComposerShell;
