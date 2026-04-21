import * as React from "react";
import { Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type LessonStatus = "draft" | "review" | "approved";

const statusClasses: Record<LessonStatus, { cls: string; label: string }> = {
  draft: {
    cls: "bg-[color:var(--sma-ink-100)] text-[color:var(--sma-ink-700)]",
    label: "مسودة",
  },
  review: {
    cls: "bg-[color:color-mix(in_srgb,var(--sma-qamar-500)_25%,transparent)] text-[color:var(--sma-qamar-900)]",
    label: "قيد المراجعة",
  },
  approved: {
    cls: "bg-[color:color-mix(in_srgb,var(--success)_20%,transparent)] text-[color:var(--success)]",
    label: "معتمد",
  },
};

export type LessonRowProps = {
  number: number | string;
  chapter: number | string;
  title: string;
  period?: number | string;
  minutes: number;
  status: LessonStatus;
  onPrepare?: () => void;
};

export function LessonRow({
  number,
  chapter,
  title,
  period,
  minutes,
  status,
  onPrepare,
}: LessonRowProps) {
  const s = statusClasses[status];
  return (
    <div className="grid grid-cols-[46px_1fr_auto_auto] gap-3.5 items-center px-1 py-3.5 border-b border-border last:border-b-0">
      <div className="text-center">
        <div
          className="text-[9px] text-muted-foreground"
          style={{ letterSpacing: "0.06em" }}
        >
          ف{chapter}
        </div>
        <div className="font-numeric text-lg font-bold text-foreground leading-none">
          {number}
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
          <Clock size={11} />
          {minutes} دقيقة
          {period ? (
            <>
              <span className="opacity-40">·</span>
              الحصة {period}
            </>
          ) : null}
        </div>
      </div>
      <span
        className={cn(
          "px-2.5 py-[3px] rounded-full text-[11px] font-semibold",
          s.cls,
        )}
      >
        {s.label}
      </span>
      <button
        type="button"
        onClick={onPrepare}
        className="inline-flex items-center gap-1.5 h-[30px] px-3 rounded-lg border border-border bg-transparent text-foreground text-xs font-medium hover:border-primary hover:text-primary transition-colors"
      >
        <Sparkles size={12} /> تحضير
      </button>
    </div>
  );
}

export default LessonRow;
