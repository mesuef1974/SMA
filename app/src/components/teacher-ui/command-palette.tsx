"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  Search,
  Home,
  Book,
  Users,
  Plus,
  ShieldCheck,
  Globe,
  Moon,
  Sun,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ItemKind = "route" | "action";

type Item = {
  id: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon: React.ElementType;
  kind: ItemKind;
  run: () => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = useLocale();
  const { setTheme, resolvedTheme } = useTheme();

  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  const go = React.useCallback(
    (path: string) => {
      close();
      // small delay to let dialog close animation start
      router.push(path);
    },
    [router, close],
  );

  const switchLocale = React.useCallback(() => {
    const other = locale === "ar" ? "en" : "ar";
    close();
    router.replace(pathname, { locale: other });
  }, [router, pathname, locale, close]);

  const toggleTheme = React.useCallback(() => {
    close();
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [setTheme, resolvedTheme, close]);

  const doSignOut = React.useCallback(() => {
    close();
    signOut({ callbackUrl: "/login" });
  }, [close]);

  const items: Item[] = React.useMemo(
    () => [
      {
        id: "home",
        label: "الرئيسية",
        hint: "لوحة التحكم",
        keywords: "home dashboard الرئيسية",
        icon: Home,
        kind: "route",
        run: () => go("/dashboard"),
      },
      {
        id: "lessons",
        label: "الدروس",
        hint: "قائمة الدروس",
        keywords: "lessons الدروس",
        icon: Book,
        kind: "route",
        run: () => go("/dashboard/lessons"),
      },
      {
        id: "students",
        label: "الطلاب",
        hint: "الفصل الدراسي",
        keywords: "students classroom الطلاب الفصل",
        icon: Users,
        kind: "route",
        run: () => go("/dashboard/classroom"),
      },
      {
        id: "new-lesson",
        label: "تحضير درس جديد",
        hint: "Lesson Composer",
        keywords: "new lesson composer جديد تحضير درس",
        icon: Plus,
        kind: "route",
        run: () => go("/lesson-composer"),
      },
      {
        id: "advisor-review",
        label: "مراجعة المستشار",
        hint: "Advisor Review",
        keywords: "advisor review مراجعة مستشار",
        icon: ShieldCheck,
        kind: "route",
        run: () => go("/dashboard/advisor/review"),
      },
      {
        id: "toggle-locale",
        label: locale === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic",
        hint: "Language",
        keywords: "language locale لغة english عربية",
        icon: Globe,
        kind: "action",
        run: switchLocale,
      },
      {
        id: "toggle-theme",
        label:
          resolvedTheme === "dark" ? "الوضع النهاري" : "الوضع الليلي",
        hint: "Theme",
        keywords: "theme dark light ثيم نهار ليل",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        kind: "action",
        run: toggleTheme,
      },
      {
        id: "signout",
        label: "تسجيل الخروج",
        hint: "Sign out",
        keywords: "signout logout تسجيل خروج",
        icon: LogOut,
        kind: "action",
        run: doSignOut,
      },
    ],
    [locale, resolvedTheme, go, switchLocale, toggleTheme, doSignOut],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.hint ?? ""} ${it.keywords ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  // reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
    }
  }, [open]);

  // clamp active index
  React.useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [filtered.length, activeIdx]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) =>
        filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[activeIdx];
      if (it) it.run();
    }
    // Esc handled natively by base-ui Dialog
  };

  // scroll active item into view
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIdx, filtered.length]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs"
        />
        <Dialog.Popup
          className={cn(
            "fixed z-50 top-[18%] left-1/2 -translate-x-1/2",
            "w-[92vw] max-w-[560px] rounded-xl bg-popover text-popover-foreground border border-border shadow-2xl",
            "flex flex-col overflow-hidden",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
            "data-ending-style:scale-95 data-starting-style:scale-95 transition duration-150",
          )}
          onKeyDown={onKeyDown}
        >
          <Dialog.Title className="sr-only">لوحة الأوامر</Dialog.Title>
          <Dialog.Description className="sr-only">
            ابحث عن صفحة أو شغّل أمرًا
          </Dialog.Description>

          <div className="flex items-center gap-2.5 px-3.5 h-[48px] border-b border-border">
            <Search size={16} className="text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث أو شغّل أمرًا…"
              aria-label="بحث أو تشغيل أمر"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
            <kbd
              className="font-numeric text-[10px] px-1.5 py-px rounded bg-muted border border-border text-muted-foreground"
              style={{ direction: "ltr" }}
            >
              Esc
            </kbd>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              لا توجد نتائج
            </div>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              aria-label="نتائج البحث"
              className="max-h-[360px] overflow-y-auto py-1.5"
            >
              {filtered.map((it, i) => {
                const Ic = it.icon;
                const active = i === activeIdx;
                return (
                  <li key={it.id} data-idx={i}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => it.run()}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-start transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/60",
                      )}
                    >
                      <Ic size={15} className="text-muted-foreground" />
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.hint ? (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {it.hint}
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-px rounded border border-border",
                          it.kind === "route"
                            ? "text-muted-foreground"
                            : "text-[color:var(--sma-sahla-700)]",
                        )}
                      >
                        {it.kind === "route" ? "صفحة" : "أمر"}
                      </span>
                      <ArrowRight
                        size={12}
                        className={cn(
                          "text-muted-foreground transition-opacity",
                          active ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between gap-2 px-3.5 h-[34px] border-t border-border text-[10.5px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <kbd className="font-numeric px-1.5 py-px rounded bg-muted border border-border" style={{ direction: "ltr" }}>↑</kbd>
                <kbd className="font-numeric px-1.5 py-px rounded bg-muted border border-border" style={{ direction: "ltr" }}>↓</kbd>
                تنقّل
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="font-numeric px-1.5 py-px rounded bg-muted border border-border" style={{ direction: "ltr" }}>Enter</kbd>
                تنفيذ
              </span>
            </div>
            <span>SMA · ⌘K</span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CommandPalette;
