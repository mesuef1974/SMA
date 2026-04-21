"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Plus } from "lucide-react";
import {
  Chrome,
  StatCard,
  LessonRow,
  MisconceptionAlert,
  BloomChart,
  type MisconceptionItem,
  type BloomData,
  type LessonStatus,
} from "@/components/teacher-ui";

// ---- Mock data (TODO: replace with /api/teacher/dashboard) ----

const stats = [
  {
    label: "طلاب نشطون",
    value: "128",
    sub: "آخر 7 أيام",
    accent: "var(--sma-najm-500)",
    delta: "+8%",
    deltaDir: "up" as const,
    spark: [10, 12, 11, 14, 16, 17, 18],
  },
  {
    label: "درسٌ مُعتمد",
    value: "24",
    sub: "هذا الفصل",
    accent: "var(--success)",
    delta: "+3",
    deltaDir: "up" as const,
    spark: [4, 6, 7, 10, 13, 18, 24],
  },
  {
    label: "متوسط التقييم",
    value: "86%",
    sub: "آخر تقييم",
    accent: "var(--sma-sahla-500)",
    delta: "−2%",
    deltaDir: "down" as const,
    spark: [90, 88, 89, 86, 84, 86, 86],
  },
  {
    label: "مفاهيم مرصودة",
    value: "7",
    sub: "تحتاج تدخّل",
    accent: "var(--sma-qamar-500)",
    delta: "2 عالية",
    deltaDir: "flat" as const,
    spark: [2, 3, 3, 5, 4, 6, 7],
  },
];

const misconceptions: MisconceptionItem[] = [
  {
    id: 1,
    name_ar: "الخلط بين المجال والمدى في الدوال",
    frequency: 14,
    severity: "high",
  },
  {
    id: 2,
    name_ar: "قسمة كسر على كسر — قاعدة الضرب بالمقلوب",
    frequency: 9,
    severity: "medium",
  },
  {
    id: 3,
    name_ar: "خصائص الأسس مع الأسس السالبة",
    frequency: 6,
    severity: "low",
  },
];

const bloom: BloomData = {
  remember: 12,
  understand: 18,
  apply: 22,
  analyze: 14,
  evaluate: 7,
  create: 3,
};

type LessonItem = {
  id: number;
  number: number;
  chapter: number;
  title: string;
  period: number;
  minutes: number;
  status: LessonStatus;
};

const weekLessons: LessonItem[] = [
  {
    id: 1,
    number: 1,
    chapter: 5,
    title: "مقدمة في الدوال الأسية",
    period: 1,
    minutes: 45,
    status: "approved",
  },
  {
    id: 2,
    number: 2,
    chapter: 5,
    title: "الرسم البياني للدالة الأسية",
    period: 2,
    minutes: 45,
    status: "review",
  },
  {
    id: 3,
    number: 3,
    chapter: 5,
    title: "نمو وتضاؤل أسي",
    period: 3,
    minutes: 45,
    status: "draft",
  },
  {
    id: 4,
    number: 4,
    chapter: 5,
    title: "الدوال اللوغاريتمية",
    period: 4,
    minutes: 45,
    status: "draft",
  },
];

export function DashboardShell({ localePath }: { localePath: string }) {
  const [activeTab, setActiveTab] = React.useState<
    "home" | "lessons" | "students" | "challenges" | "analytics" | "ai"
  >("home");

  return (
    <Chrome activeTab={activeTab} onTab={setActiveTab}>
      <div className="max-w-[1440px] mx-auto px-7 py-7">
        {/* greeting row */}
        <section className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading text-[28px] font-bold text-foreground leading-tight">
              أهلًا، أ. محمد
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              الأربعاء، 22 أبريل 2026 · الصف 10 — رياضيات
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-border bg-card">
              <span className="w-2 h-2 rounded-full bg-[color:var(--success)]" />
              سَهْلة جاهزة
            </span>
            <Link
              href={`${localePath}/lesson-composer`}
              className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] text-white text-xs font-semibold shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, var(--sma-najm-700) 0%, var(--sma-sahla-600) 100%)",
              }}
            >
              <Plus size={14} /> تحضير درس جديد
            </Link>
          </div>
        </section>

        {/* stat strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </section>

        {/* bento grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 mb-3.5">
          {/* left: alerts + bloom (2fr) */}
          <div className="lg:col-span-2 flex flex-col gap-3.5">
            <div className="bg-card border border-border rounded-[16px] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading text-base font-semibold text-foreground">
                  تنبيهات مفاهيم خاطئة
                </h2>
                <Link
                  href="#"
                  className="text-[11px] text-primary font-medium hover:underline"
                >
                  عرض الكل ←
                </Link>
              </div>
              <MisconceptionAlert items={misconceptions} />
            </div>

            <div className="bg-card border border-border rounded-[16px] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading text-base font-semibold text-foreground">
                  أهداف بلوم — التوزيع الأسبوعي
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  آخر 76 سؤالًا
                </span>
              </div>
              <BloomChart data={bloom} />
            </div>
          </div>

          {/* right: today's lesson (1fr) */}
          <div className="bg-card border border-border rounded-[16px] p-5 flex flex-col">
            <h2 className="font-heading text-base font-semibold text-foreground mb-3">
              درس اليوم
            </h2>
            <div
              className="rounded-[12px] p-4 mb-4"
              style={{
                background:
                  "color-mix(in srgb, var(--sma-sahla-500) 8%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--sma-sahla-500) 22%, transparent)",
              }}
            >
              <div className="text-[11px] text-muted-foreground mb-1">
                الحصة 2 · 10:15 ص
              </div>
              <div className="font-heading text-lg font-bold text-foreground mb-1">
                الرسم البياني للدالة الأسية
              </div>
              <div className="text-[12px] text-muted-foreground">
                الفصل 5 · الصف 10 — رياضيات
              </div>
            </div>
            <ul className="space-y-2 text-[13px] text-foreground mb-4">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                ربط بنمو البكتيريا كمدخل
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                ثلاثة أمثلة متدرّجة
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                تقييم سريع من 4 أسئلة (بلوم متنوع)
              </li>
            </ul>
            <Link
              href={`${localePath}/lesson-composer`}
              className="mt-auto inline-flex items-center justify-center gap-1.5 h-[36px] rounded-[10px] bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Sparkles size={14} /> فتح المحرّر
            </Link>
          </div>
        </section>

        {/* lesson list */}
        <section className="bg-card border border-border rounded-[16px] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base font-semibold text-foreground">
              دروس الأسبوع
            </h2>
            <Link
              href="#"
              className="text-[11px] text-primary font-medium hover:underline"
            >
              عرض المنهج ←
            </Link>
          </div>
          <div>
            {weekLessons.map((l) => (
              <LessonRow
                key={l.id}
                number={l.number}
                chapter={l.chapter}
                title={l.title}
                period={l.period}
                minutes={l.minutes}
                status={l.status}
                onPrepare={() => {
                  // TODO: navigate to composer with lesson prefilled
                  window.location.href = `${localePath}/lesson-composer?lesson=${l.id}`;
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </Chrome>
  );
}

export default DashboardShell;
