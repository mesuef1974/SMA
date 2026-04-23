import * as React from "react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

export type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string; // css color for sparkline
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
  spark?: number[];
  className?: string;
};

/**
 * StatCard — label / big numeric value / delta+sub / optional sparkline.
 * Numbers use JetBrains Mono via Tailwind `font-numeric`.
 */
export function StatCard({
  label,
  value,
  sub,
  accent = "var(--primary)",
  delta,
  deltaDir = "flat",
  spark,
  className,
}: StatCardProps) {
  const deltaColor =
    deltaDir === "up"
      ? "text-[color:var(--success)]"
      : deltaDir === "down"
        ? "text-[color:var(--destructive)]"
        : "text-muted-foreground";
  const arrow = deltaDir === "up" ? "↑" : deltaDir === "down" ? "↓" : "·";

  return (
    <div
      className={cn(
        "bg-card text-card-foreground border border-border rounded-[16px]",
        "px-[18px] pt-[18px] pb-[14px] flex flex-col items-center text-center gap-1.5",
        "transition-[border-color,transform] duration-200 ease-[var(--ease-teacher-standard)]",
        "hover:border-primary/60 hover:-translate-y-px",
        "relative overflow-hidden",
        className,
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div
        className="font-numeric tabular-nums text-[34px] font-bold text-foreground leading-none"
        style={{ letterSpacing: "-0.025em" }}
      >
        {value}
      </div>
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        {delta ? (
          <span className={cn("font-semibold inline-flex items-center gap-0.5", deltaColor)}>
            {arrow} {delta}
          </span>
        ) : null}
        {delta && sub ? <span className="opacity-40">·</span> : null}
        {sub ? <span>{sub}</span> : null}
      </div>
      {spark && spark.length > 0 ? (
        <div className="mt-2 opacity-90">
          <Sparkline points={spark} color={accent} />
        </div>
      ) : null}
    </div>
  );
}

export default StatCard;
