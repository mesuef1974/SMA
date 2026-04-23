import * as React from "react";

export type BloomData = {
  remember?: number;
  understand?: number;
  apply?: number;
  analyze?: number;
  evaluate?: number;
  create?: number;
};

const levels: { key: keyof BloomData; label: string; color: string }[] = [
  { key: "remember", label: "تذكّر", color: "var(--sma-najm-300)" },
  { key: "understand", label: "فهم", color: "var(--sma-najm-500)" },
  { key: "apply", label: "تطبيق", color: "var(--sma-sahla-500)" },
  { key: "analyze", label: "تحليل", color: "var(--sma-sahla-700)" },
  { key: "evaluate", label: "تقييم", color: "var(--sma-qamar-500)" },
  { key: "create", label: "إبداع", color: "var(--sma-qamar-700)" },
];

export function BloomChart({ data }: { data: BloomData }) {
  const values = levels.map((l) => data[l.key] ?? 0);
  const max = Math.max(1, ...values);
  const total = values.reduce((s, v) => s + v, 0);
  return (
    <div>
      {levels.map((l) => {
        const v = data[l.key] ?? 0;
        const pct = max === 0 ? 0 : (v / max) * 100;
        return (
          <div
            key={l.key}
            className="grid grid-cols-[64px_1fr_32px] gap-2.5 items-center py-[7px]"
          >
            <span className="text-xs text-foreground font-medium">{l.label}</span>
            <div className="h-2 rounded-[4px] bg-[color:var(--sma-ink-100)] overflow-hidden">
              <div
                className="h-full rounded-[4px] transition-[width] duration-500 ease-[var(--ease-teacher-standard)]"
                style={{ width: `${pct}%`, background: l.color }}
              />
            </div>
            <span className="font-numeric tabular-nums text-xs text-muted-foreground text-end">
              {v}
            </span>
          </div>
        );
      })}
      <div className="mt-2.5 pt-2.5 border-t border-dashed border-border flex justify-between text-[11px] text-muted-foreground">
        <span>إجمالي الأسئلة</span>
        <span className="font-numeric font-semibold text-foreground">{total}</span>
      </div>
    </div>
  );
}

export default BloomChart;
