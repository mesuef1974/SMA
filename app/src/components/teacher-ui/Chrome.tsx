"use client";

import * as React from "react";
import {
  Home,
  Book,
  Users,
  Swords,
  BarChart3,
  MessageSquare,
  Search,
  Bell,
  Sparkles,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** SMA square-mim logo (simplified) */
function SMAMark({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <g
        fill="none"
        stroke="var(--sma-najm-700)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="32" y="26" width="48" height="48" rx="6" />
        <path d="M42 74 L42 96" />
      </g>
    </svg>
  );
}

type PrimaryKey =
  | "home"
  | "lessons"
  | "students"
  | "challenges"
  | "analytics"
  | "ai";

const primary: { key: PrimaryKey; label: string; icon: React.ElementType }[] = [
  { key: "home", label: "الرئيسية", icon: Home },
  { key: "lessons", label: "الدروس", icon: Book },
  { key: "students", label: "الطلاب", icon: Users },
  { key: "challenges", label: "التحديات", icon: Swords },
  { key: "analytics", label: "التحليلات", icon: BarChart3 },
  { key: "ai", label: "المحادثة الذكية", icon: MessageSquare },
];

export type ChromeProps = {
  activeTab?: PrimaryKey;
  onTab?: (key: PrimaryKey) => void;
  children: React.ReactNode;
};

export function Chrome({ activeTab = "home", onTab, children }: ChromeProps) {
  // TODO(integration): wire ⌘K / ⌘N / ⌘J to a real Command Palette (shadcn command).
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.info("[teacher-ui] ⌘K pressed — Command Palette stub");
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.info("[teacher-ui] ⌘N pressed — New lesson stub");
      } else if (e.key.toLowerCase() === "j") {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.info("[teacher-ui] ⌘J pressed — Help stub");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--sma-ink-50)] dark:bg-background font-body">
      {/* ---------------- top bar ---------------- */}
      <header
        className={cn(
          "h-[60px] px-7 flex items-center gap-3.5",
          "bg-card/80 backdrop-blur-md backdrop-saturate-150",
          "border-b border-border sticky top-0 z-40",
        )}
      >
        <div className="flex items-center gap-2.5">
          <SMAMark size={26} />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-wide font-heading">SMA</span>
            <span className="text-[10px] text-muted-foreground">محلل الرياضيات</span>
          </div>
        </div>

        {/* workspace switcher */}
        <button
          type="button"
          className="flex items-center gap-2 h-[34px] px-3 rounded-[10px] bg-muted border border-border text-foreground text-xs mr-1.5 hover:border-primary/60 transition-colors"
        >
          <span
            className="w-[18px] h-[18px] rounded-[5px]"
            style={{
              background:
                "linear-gradient(135deg, var(--sma-sahla-500), var(--sma-najm-600))",
            }}
          />
          <span className="font-medium">ثانوية قطر النموذجية</span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>

        <div className="flex-1" />

        {/* ⌘K search */}
        <button
          type="button"
          className="flex items-center gap-2.5 h-[34px] pr-3 pl-2.5 rounded-[10px] bg-muted border border-border text-muted-foreground text-xs min-w-[260px] hover:border-primary/60 transition-colors"
          aria-label="بحث أو تشغيل أمر"
        >
          <Search size={15} />
          <span className="flex-1 text-start">ابحث أو شغّل أمرًا…</span>
          <kbd
            className="font-numeric text-[10px] px-1.5 py-px rounded bg-card border border-border text-foreground"
            style={{ direction: "ltr" }}
          >
            ⌘ K
          </kbd>
        </button>

        {/* AI shortcut — gold */}
        <button
          type="button"
          className="h-[34px] px-3 rounded-[10px] inline-flex items-center gap-1.5 font-semibold text-xs"
          style={{
            background:
              "color-mix(in srgb, var(--sma-sahla-500) 12%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--sma-sahla-600) 45%, transparent)",
            color: "var(--sma-sahla-700)",
          }}
        >
          <Sparkles size={14} /> اسأل سَهْلة
        </button>

        <button
          type="button"
          className="w-[34px] h-[34px] rounded-[10px] bg-transparent border border-border text-foreground flex items-center justify-center relative hover:border-primary/60 transition-colors"
          aria-label="الإشعارات"
        >
          <Bell size={15} />
          <span className="absolute top-1.5 end-1.5 w-[7px] h-[7px] rounded-full bg-[color:var(--sma-qamar-500)]" />
        </button>

        <div className="flex items-center gap-2.5 ps-1 pe-2.5 py-1 rounded-full border border-border bg-card">
          <div className="text-xs text-end leading-tight">
            <div className="font-semibold">أ. محمد العتيبي</div>
            <div className="text-muted-foreground text-[10px]">معلم · الصف 10</div>
          </div>
          <div
            className="w-[30px] h-[30px] rounded-full text-white flex items-center justify-center font-bold text-xs"
            style={{
              background:
                "linear-gradient(135deg, var(--sma-najm-600), var(--sma-najm-800))",
            }}
          >
            م.أ
          </div>
        </div>
      </header>

      {/* ---------------- subnav ---------------- */}
      <nav
        className={cn(
          "bg-card border-b border-border px-7 flex gap-1",
          "sticky top-[60px] z-30",
        )}
      >
        {primary.map((t) => {
          const Ic = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTab?.(t.key)}
              className={cn(
                "relative inline-flex items-center gap-1.5 h-[46px] px-3 bg-transparent border-0 text-[13px] transition-colors",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground font-medium hover:text-foreground",
              )}
            >
              <Ic size={15} /> {t.label}
              {isActive ? (
                <span className="absolute start-2 end-2 -bottom-px h-[2px] rounded-[2px] bg-[color:var(--sma-najm-700)]" />
              ) : null}
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          type="button"
          className="self-center h-[30px] px-2.5 inline-flex items-center gap-1.5 rounded-lg bg-transparent border border-border text-muted-foreground text-[11px] hover:text-foreground hover:border-primary/60 transition-colors"
        >
          <HelpCircle size={13} /> مركز المساعدة
        </button>
      </nav>

      {/* ---------------- main ---------------- */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* ---------------- footer ---------------- */}
      <footer className="mt-8 border-t border-border bg-card">
        <div className="max-w-[1440px] mx-auto px-7 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <SMAMark size={22} />
              <span className="font-heading text-sm font-bold">SMA</span>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              منصّة ذكيّة لتدريس الرياضيات بالعربية — تخطيط، تشخيص، وتحديات.
            </p>
          </div>
          <FooterCol
            title="المنتج"
            items={["الدروس", "الطلاب", "التحديات", "التحليلات"]}
          />
          <FooterCol
            title="موارد"
            items={["دليل المعلم", "المنهج القطري", "أسئلة شائعة", "مركز المساعدة"]}
          />
          <FooterCol
            title="الشركة"
            items={["عن SMA", "الخصوصية", "شروط الاستخدام", "تواصل"]}
          />
        </div>
        <div className="border-t border-border">
          <div className="max-w-[1440px] mx-auto px-7 py-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>© 2026 SMA — جميع الحقوق محفوظة.</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="relative inline-block w-2 h-2 rounded-full bg-[color:var(--success)]">
                <span className="absolute inset-0 rounded-full bg-[color:var(--success)] opacity-75 animate-ping" />
              </span>
              جميع الأنظمة تعمل
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-foreground mb-2.5 tracking-wide">
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it}>
            <a
              href="#"
              className="text-[12px] text-muted-foreground hover:text-primary transition-colors"
            >
              {it}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Chrome;
