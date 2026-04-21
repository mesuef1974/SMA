"use client";

import * as React from "react";
import { Plus, Sparkles, Save, Upload, GripVertical } from "lucide-react";
import { Chrome } from "@/components/teacher-ui";
import { cn } from "@/lib/utils";

// Lesson Composer — sidebar outline + main editor.
// Mock data + local state. TODO: wire to /api/teacher/lesson-plans.

type Section = {
  id: string;
  title: string;
  minutes: number;
  body: string;
};

const initialSections: Section[] = [
  {
    id: "warmup",
    title: "تهيئة وتحفيز",
    minutes: 5,
    body: "سؤال محفّز: كيف يتضاعف عدد خلايا البكتيريا كل ساعة؟",
  },
  {
    id: "concept",
    title: "المفهوم الأساسي",
    minutes: 12,
    body: "تعريف الدالة الأسية وتمثيلها بيانيًا.",
  },
  {
    id: "activity",
    title: "نشاط تطبيقي",
    minutes: 18,
    body: "حل ثلاثة أمثلة بالتدرج، مع مناقشة جماعية.",
  },
  {
    id: "assessment",
    title: "تقييم سريع",
    minutes: 7,
    body: "اختبار قصير من 4 أسئلة متعدد المستويات (بلوم).",
  },
  {
    id: "closure",
    title: "إغلاق",
    minutes: 3,
    body: "تلخيص وروابط لفيديو الدرس المنزلي.",
  },
];

export function ComposerShell() {
  const [sections, setSections] = React.useState<Section[]>(initialSections);
  const [activeId, setActiveId] = React.useState<string>(initialSections[0].id);
  const [title, setTitle] = React.useState("الدوال الأسية");

  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const total = sections.reduce((s, x) => s + x.minutes, 0);

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

  return (
    <Chrome activeTab="lessons">
      <div className="max-w-[1440px] mx-auto px-7 py-7">
        {/* header row */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">
              خطة درس — مسودة
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-heading text-[28px] font-bold text-foreground leading-tight bg-transparent border-0 outline-none focus:ring-2 focus:ring-ring rounded-md px-1 -mx-1"
              aria-label="عنوان الدرس"
            />
            <div className="flex items-center gap-2 mt-2">
              <Chip>الصف 10</Chip>
              <Chip>الفصل 5 — الوحدة 2</Chip>
              <Chip>
                <span className="font-numeric tabular-nums">{total}</span> دقيقة
              </Chip>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-border bg-card text-foreground text-xs font-medium hover:border-primary/60"
            >
              <Sparkles size={14} /> اقتراح من سَهْلة
            </button>
          </div>
        </div>

        {/* sidebar + main */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3.5">
          {/* sidebar — outline */}
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

          {/* main editor */}
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
              placeholder="مسائل 1–5 من الكتاب، ص 112…"
            />
          </section>
        </div>

        {/* sticky bottom bar */}
        <div className="sticky bottom-4 mt-5 flex justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 backdrop-blur-md px-2 py-2 shadow-md">
            <span className="text-[11px] text-muted-foreground pe-2">
              آخر حفظ: قبل لحظات ·{" "}
              <span className="font-numeric tabular-nums">{total}</span> دقيقة
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-border bg-transparent text-foreground text-xs font-medium hover:border-primary/60"
            >
              <Save size={14} /> حفظ كمسودة
            </button>
            <button
              type="button"
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
