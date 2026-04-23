"use client";

/**
 * BL-026 — Teacher notifications bell.
 *
 * Polls /api/teacher/unread-reviews every 60s, shows a numeric badge on
 * the bell icon, and renders a dropdown listing unread advisor decisions
 * newest first. Each row links to the corresponding plan and gets
 * marked-read on click. A "اعتبر الكل مقروءاً" action clears everything.
 */

import * as React from "react";
import { Bell } from "lucide-react";
import { Link } from "@/i18n/navigation";

type UnreadReview = {
  id: string;
  lessonPlanId: string;
  decision: "approved" | "rejected" | "changes_requested";
  comment: string | null;
  createdAt: string;
  lessonId: string | null;
  periodNumber: number | null;
};

const POLL_INTERVAL_MS = 60_000;

const DECISION_LABEL: Record<UnreadReview["decision"], string> = {
  approved: "اعتماد الخطة",
  changes_requested: "طلب تعديلات",
  rejected: "رفض الخطة",
};

const DECISION_DOT: Record<UnreadReview["decision"], string> = {
  approved: "bg-emerald-500",
  changes_requested: "bg-amber-500",
  rejected: "bg-rose-500",
};

function relativeTimeAr(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `قبل ${hrs} ساعة`;
  const days = Math.round(hrs / 24);
  return `قبل ${days} يوم`;
}

export function NotificationsBell() {
  const [open, setOpen] = React.useState(false);
  const [reviews, setReviews] = React.useState<UnreadReview[]>([]);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const fetchUnread = React.useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/teacher/unread-reviews", {
        signal,
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { reviews?: UnreadReview[] };
      setReviews(data.reviews ?? []);
    } catch {
      // Network hiccup / aborted — keep last snapshot.
    }
  }, []);

  // Initial load + polling.
  React.useEffect(() => {
    const controller = new AbortController();
    void fetchUnread(controller.signal);
    const timer = window.setInterval(
      () => void fetchUnread(),
      POLL_INTERVAL_MS,
    );
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [fetchUnread]);

  // Click-outside / Escape to close.
  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = React.useCallback(
    async (planId?: string) => {
      try {
        await fetch("/api/teacher/unread-reviews", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: planId ? JSON.stringify({ planId }) : "{}",
        });
      } catch {
        // Best-effort; the next poll will reconcile state.
      }
      // Optimistically prune from local list.
      setReviews((prev) =>
        planId ? prev.filter((r) => r.lessonPlanId !== planId) : [],
      );
    },
    [],
  );

  const count = reviews.length;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-[34px] h-[34px] rounded-[10px] bg-transparent border border-border text-foreground flex items-center justify-center relative hover:border-primary/60 transition-colors"
        aria-label={
          count > 0
            ? `الإشعارات — ${count} غير مقروءة`
            : "الإشعارات"
        }
      >
        <Bell size={15} />
        {count > 0 ? (
          <span
            className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold inline-flex items-center justify-center border-2 border-card"
            style={{ direction: "ltr" }}
            aria-hidden="true"
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="الإشعارات"
          className="absolute end-0 mt-2 w-[320px] rounded-lg bg-popover text-popover-foreground border border-border shadow-md z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div className="text-xs font-semibold">الإشعارات</div>
            {count > 0 ? (
              <button
                type="button"
                onClick={() => void markRead()}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                اعتبر الكل مقروءاً
              </button>
            ) : null}
          </div>

          {count === 0 ? (
            <div className="px-4 py-6 text-xs text-muted-foreground text-center">
              لا إشعارات جديدة
            </div>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto divide-y divide-border">
              {reviews.map((r) => {
                const href = r.lessonId
                  ? `/dashboard/lessons/${r.lessonId}/prepare`
                  : `/dashboard/lesson-plans/${r.lessonPlanId}`;
                return (
                  <li key={r.id}>
                    <Link
                      href={href}
                      onClick={() => {
                        setOpen(false);
                        void markRead(r.lessonPlanId);
                      }}
                      className="flex gap-2.5 px-4 py-3 hover:bg-accent/60 transition-colors"
                    >
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${DECISION_DOT[r.decision]}`}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold">
                          {DECISION_LABEL[r.decision]}
                          {r.periodNumber != null ? (
                            <span className="ms-1 text-muted-foreground font-normal">
                              · الحصة {r.periodNumber}
                            </span>
                          ) : null}
                        </div>
                        {r.comment ? (
                          <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {r.comment}
                          </div>
                        ) : null}
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {relativeTimeAr(r.createdAt)}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
