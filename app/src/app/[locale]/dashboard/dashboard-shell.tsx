"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Plus } from "lucide-react";
import {
  StatCard,
  LessonRow,
  MisconceptionAlert,
  BloomChart,
  type MisconceptionItem,
  type BloomData,
  type LessonStatus,
} from "@/components/teacher-ui";

// ---- Shell props — populated by the server page from Drizzle ----

export type DashboardStat = {
  label: string;
  value: string;
  sub: string;
  accent: string;
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
  spark?: number[];
};

export type DashboardLessonItem = {
  id: string;
  number: number | string;
  chapter: number | string;
  title: string;
  period?: number;
  minutes: number;
  status: LessonStatus;
};

export type DashboardTodayLesson = {
  id: string;
  title: string;
  chapter: number | string;
  period?: number;
} | null;

export type DashboardShellProps = {
  localePath: string;
  userName: string;
  todayLabel: string;
  stats: DashboardStat[];
  todayLesson: DashboardTodayLesson;
  weekLessons: DashboardLessonItem[];
  misconceptions: MisconceptionItem[];
  bloom: BloomData;
};

export function DashboardShell({
  localePath,
  userName,
  todayLabel,
  stats,
  todayLesson,
  weekLessons,
  misconceptions,
  bloom,
}: DashboardShellProps) {
  const router = useRouter();

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-7 py-7">
        {/* greeting row */}
        <section className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading text-[28px] font-bold text-foreground leading-tight">
              أهلًا، {userName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{todayLabel}</p>
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
                  href={`${localePath}/dashboard/misconceptions`}
                  className="text-[11px] text-primary font-medium hover:underline"
                >
                  عرض الكل ←
                </Link>
              </div>
              {misconceptions.length > 0 ? (
                <MisconceptionAlert items={misconceptions} />
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  لا توجد مفاهيم خاطئة مرصودة بعد.
                </p>
              )}
            </div>

            <div className="bg-card border border-border rounded-[16px] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading text-base font-semibold text-foreground">
                  أهداف بلوم — التوزيع الأسبوعي
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  عبر جميع الخطط المُعتمدة
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
            {todayLesson ? (
              <>
                <div
                  className="rounded-[12px] p-4 mb-4"
                  style={{
                    background:
                      "color-mix(in srgb, var(--sma-sahla-500) 8%, transparent)",
                    border:
                      "1px solid color-mix(in srgb, var(--sma-sahla-500) 22%, transparent)",
                  }}
                >
                  {todayLesson.period ? (
                    <div className="text-[11px] text-muted-foreground mb-1">
                      الحصة {todayLesson.period}
                    </div>
                  ) : null}
                  <div className="font-heading text-lg font-bold text-foreground mb-1">
                    {todayLesson.title}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    الفصل {todayLesson.chapter}
                  </div>
                </div>
                <Link
                  href={`${localePath}/lesson-composer?lessonId=${todayLesson.id}`}
                  className="mt-auto inline-flex items-center justify-center gap-1.5 h-[36px] rounded-[10px] bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={14} /> فتح المحرّر
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground flex-1">
                  لا توجد خطة درس نشطة اليوم. ابدأ تحضير درس جديد.
                </p>
                <Link
                  href={`${localePath}/lesson-composer`}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 h-[36px] rounded-[10px] bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} /> تحضير درس
                </Link>
              </>
            )}
          </div>
        </section>

        {/* lesson list */}
        <section className="bg-card border border-border rounded-[16px] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base font-semibold text-foreground">
              دروس الأسبوع
            </h2>
            <Link
              href={`${localePath}/dashboard/lessons`}
              className="text-[11px] text-primary font-medium hover:underline"
            >
              عرض المنهج ←
            </Link>
          </div>
          {weekLessons.length > 0 ? (
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
                    router.push(
                      `${localePath}/lesson-composer?lessonId=${l.id}`,
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              لا توجد دروس في خطة هذا الأسبوع بعد.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

export default DashboardShell;
