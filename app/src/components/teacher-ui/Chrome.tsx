"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  Home,
  Book,
  Users,
  Swords,
  BarChart3,
  MessageSquare,
  Search,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Globe,
  Sun,
  Moon,
  Plus,
  LogOut,
  Settings,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CommandPalette } from "./command-palette";
import { NotificationsBell } from "./notifications-bell";

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

type PrimaryTab = {
  key: PrimaryKey;
  label: string;
  icon: React.ElementType;
  /** path suffix appended after `/{locale}` — e.g. "/dashboard" or "/dashboard/lessons" */
  path: string;
  /** when true, render a disabled button with "قريباً" tooltip instead of a Link */
  comingSoon?: boolean;
};

const primary: PrimaryTab[] = [
  { key: "home", label: "الرئيسية", icon: Home, path: "/dashboard" },
  { key: "lessons", label: "الدروس", icon: Book, path: "/dashboard/lessons" },
  { key: "students", label: "الطلاب", icon: Users, path: "/dashboard/classroom" },
  { key: "challenges", label: "التحديات", icon: Swords, path: "/dashboard/challenges" },
  { key: "analytics", label: "التحليلات", icon: BarChart3, path: "/dashboard/analytics", comingSoon: true },
  { key: "ai", label: "المحادثة الذكية", icon: MessageSquare, path: "/dashboard/chat", comingSoon: true },
];

export type ChromeUser = {
  name?: string | null;
  email?: string | null;
  roleLabel?: string | null;
};

export type ChromeProps = {
  /** @deprecated active tab is now derived from `usePathname()` */
  activeTab?: PrimaryKey;
  /** @deprecated tabs are now real Links */
  onTab?: (key: PrimaryKey) => void;
  /** Optional user meta for the avatar/dropdown. Falls back to a stub. */
  user?: ChromeUser;
  children: React.ReactNode;
};

/** Derive 2-letter initials from an Arabic or Latin name. */
function initialsOf(name?: string | null): string {
  if (!name) return "م.أ";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "م.أ";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}.${parts[1][0]}`;
}

/** Mount guard — avoids hydration mismatch for theme/locale toggles. */
function useIsMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function Chrome({ user, children }: ChromeProps) {
  // next-intl's usePathname returns the pathname without the locale prefix
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const locale = useLocale();
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useIsMounted();

  const [commandOpen, setCommandOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const otherLocale = locale === "ar" ? "en" : "ar";
  const otherLocaleLabel = locale === "ar" ? "English" : "العربية";

  const switchLocale = React.useCallback(() => {
    router.replace(pathname, { locale: otherLocale });
  }, [router, pathname, otherLocale]);

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [setTheme, resolvedTheme]);

  const displayName = user?.name ?? "أ. محمد العتيبي";
  const displayRole = user?.roleLabel ?? "معلم · الصف 10";
  const displayEmail = user?.email ?? null;
  const avatarInitials = initialsOf(user?.name);
  // ⌘K / Ctrl+K opens Command Palette; ⌘N jumps to composer.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/lesson-composer");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--sma-ink-50)] dark:bg-background font-body">
      {/* ---------------- top bar ---------------- */}
      <header
        className={cn(
          "h-[60px] px-4 md:px-7 flex items-center gap-2 md:gap-3.5",
          "bg-card/80 backdrop-blur-md backdrop-saturate-150",
          "border-b border-border sticky top-0 z-40",
        )}
      >
        {/* mobile hamburger — nav sheet */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            aria-label="قائمة التنقل"
            className="md:hidden w-[34px] h-[34px] rounded-[10px] bg-transparent border border-border text-foreground inline-flex items-center justify-center hover:border-primary/60 transition-colors"
          >
            <Menu size={16} />
          </SheetTrigger>
          <SheetContent side="right" className="w-[80vw] max-w-[320px] p-0">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <SMAMark size={22} /> SMA
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col px-2 pb-4">
              {primary.map((t) => {
                const Ic = t.icon;
                const href = t.path;
                const isActive =
                  t.path === "/dashboard"
                    ? pathname === href || pathname === `${href}/`
                    : pathname === href || pathname.startsWith(`${href}/`);
                const cls = cn(
                  "flex items-center gap-2.5 px-3 h-[42px] rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-foreground hover:bg-accent/60",
                  t.comingSoon && "opacity-60 cursor-not-allowed",
                );
                if (t.comingSoon) {
                  return (
                    <button
                      key={t.key}
                      type="button"
                      disabled
                      className={cls}
                      title="قريباً"
                    >
                      <Ic size={16} /> {t.label}
                      <span className="ms-auto text-[10px] text-muted-foreground">
                        قريباً
                      </span>
                    </button>
                  );
                }
                return (
                  <Link
                    key={t.key}
                    href={href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cls}
                  >
                    <Ic size={16} /> {t.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2.5">
          <SMAMark size={26} />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-wide font-heading">SMA</span>
            <span className="text-[10px] text-muted-foreground">محلل الرياضيات</span>
          </div>
        </div>

        {/* workspace switcher — hide on small */}
        <button
          type="button"
          className="hidden lg:flex items-center gap-2 h-[34px] px-3 rounded-[10px] bg-muted border border-border text-foreground text-xs mr-1.5 hover:border-primary/60 transition-colors"
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

        {/* ⌘K search — icon-only on mobile, full pill on md+ */}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="md:hidden w-[34px] h-[34px] rounded-[10px] bg-muted border border-border text-muted-foreground inline-flex items-center justify-center hover:border-primary/60 transition-colors"
          aria-label="بحث أو تشغيل أمر"
        >
          <Search size={15} />
        </button>
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="hidden md:flex items-center gap-2.5 h-[34px] pr-3 pl-2.5 rounded-[10px] bg-muted border border-border text-muted-foreground text-xs min-w-[200px] lg:min-w-[260px] hover:border-primary/60 transition-colors"
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

        {/* AI shortcut — gold; hide label on small */}
        <button
          type="button"
          className="hidden md:inline-flex h-[34px] px-3 rounded-[10px] items-center gap-1.5 font-semibold text-xs"
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

        {/* language toggle (ar ↔ en) */}
        <button
          type="button"
          onClick={switchLocale}
          className="h-[34px] px-2.5 rounded-[10px] bg-transparent border border-border text-foreground inline-flex items-center gap-1.5 text-xs hover:border-primary/60 transition-colors"
          aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          title={otherLocaleLabel}
        >
          <Globe size={14} />
          <span className="hidden sm:inline">{otherLocaleLabel}</span>
        </button>

        {/* dark mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-[34px] h-[34px] rounded-[10px] bg-transparent border border-border text-foreground flex items-center justify-center hover:border-primary/60 transition-colors"
          aria-label={
            resolvedTheme === "dark"
              ? "تفعيل الوضع النهاري"
              : "تفعيل الوضع الليلي"
          }
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun size={15} />
          ) : (
            <Moon size={15} />
          )}
        </button>

        {/* notifications bell — BL-026 */}
        <NotificationsBell />

        {/* + new lesson — primary/najm */}
        <button
          type="button"
          onClick={() => router.push("/lesson-composer")}
          className="h-[34px] px-3 rounded-[10px] inline-flex items-center gap-1.5 text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity"
          style={{
            background:
              "linear-gradient(135deg, var(--sma-najm-700) 0%, var(--sma-sahla-600) 100%)",
          }}
          aria-label="تحضير درس جديد"
        >
          <Plus size={14} /> <span className="hidden sm:inline">درس جديد</span>
        </button>

        {/* avatar + dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="قائمة المستخدم"
            className="flex items-center gap-2.5 ps-1 pe-2.5 py-1 rounded-full border border-border bg-card hover:border-primary/60 transition-colors cursor-pointer"
          >
            <div className="hidden md:block text-xs text-end leading-tight">
              <div className="font-semibold">{displayName}</div>
              <div className="text-muted-foreground text-[10px]">
                {displayRole}
              </div>
            </div>
            <div
              className="w-[30px] h-[30px] rounded-full text-white flex items-center justify-center font-bold text-xs"
              style={{
                background:
                  "linear-gradient(135deg, var(--sma-najm-600), var(--sma-najm-800))",
              }}
            >
              {avatarInitials}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="min-w-[220px]">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5 py-1">
                <span className="text-sm font-semibold text-foreground">
                  {displayName}
                </span>
                {displayEmail ? (
                  <span
                    className="text-[11px] text-muted-foreground"
                    style={{ direction: "ltr", textAlign: "start" }}
                  >
                    {displayEmail}
                  </span>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled
              title="قريباً"
              aria-disabled="true"
            >
              <Settings /> الإعدادات
              <span className="ms-auto text-[10px] text-muted-foreground">
                قريباً
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut /> تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* ---------------- subnav (desktop/tablet) ---------------- */}
      <nav
        className={cn(
          "bg-card border-b border-border px-4 md:px-7 hidden md:flex gap-1 overflow-x-auto",
          "sticky top-[60px] z-30",
        )}
      >
        {primary.map((t) => {
          const Ic = t.icon;
          const href = t.path;
          // next-intl usePathname() strips the locale, so match against t.path directly
          // exact match for /dashboard (home) to avoid always-active; prefix match for nested
          const isActive =
            t.path === "/dashboard"
              ? pathname === href || pathname === `${href}/`
              : pathname === href || pathname.startsWith(`${href}/`);

          const inner = (
            <>
              <Ic size={15} /> {t.label}
              {isActive ? (
                <span className="absolute start-2 end-2 -bottom-px h-[2px] rounded-[2px] bg-[color:var(--sma-najm-700)]" />
              ) : null}
            </>
          );

          const baseCls = cn(
            "relative inline-flex items-center gap-1.5 h-[46px] px-3 bg-transparent border-0 text-[13px] transition-colors",
            isActive
              ? "text-foreground font-semibold"
              : "text-muted-foreground font-medium hover:text-foreground",
          );

          if (t.comingSoon) {
            return (
              <button
                key={t.key}
                type="button"
                disabled
                title="قريباً"
                aria-disabled="true"
                className={cn(baseCls, "cursor-not-allowed opacity-60 hover:text-muted-foreground")}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={t.key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={baseCls}
            >
              {inner}
            </Link>
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
        <div className="max-w-[1440px] mx-auto px-4 md:px-7 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* ---------------- command palette ---------------- */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
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
