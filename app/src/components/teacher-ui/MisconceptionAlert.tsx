import * as React from "react";

export type Severity = "high" | "medium" | "low";

export type MisconceptionItem = {
  id?: string | number;
  name_ar: string;
  frequency: number;
  severity: Severity;
};

const sev: Record<Severity, { dot: string; label: string }> = {
  high: { dot: "bg-[color:var(--destructive)]", label: "عالية" },
  medium: { dot: "bg-[color:var(--sma-qamar-500)]", label: "متوسطة" },
  low: { dot: "bg-[color:var(--sma-sahla-500)]", label: "منخفضة" },
};

export function MisconceptionAlert({ items }: { items: MisconceptionItem[] }) {
  if (!items.length) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        لا مفاهيم خاطئة مرصودة اليوم.
      </div>
    );
  }
  return (
    <div>
      {items.map((m, i) => {
        const st = sev[m.severity];
        const isLast = i === items.length - 1;
        return (
          <div
            key={m.id ?? i}
            className={
              "grid grid-cols-[auto_1fr_auto] gap-3 items-center px-1 py-3 " +
              (isLast ? "" : "border-b border-border")
            }
          >
            <span
              className={"inline-block w-2 h-2 rounded-full " + st.dot}
              aria-hidden="true"
            />
            <div>
              <div className="text-[13px] font-medium text-foreground leading-relaxed">
                {m.name_ar}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                <span className="font-numeric tabular-nums">{m.frequency}</span>{" "}
                طالبًا · {st.label}
              </div>
            </div>
            <button
              type="button"
              className="bg-transparent border-0 text-primary text-[11px] font-medium hover:underline cursor-pointer"
            >
              مراجعة →
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default MisconceptionAlert;
