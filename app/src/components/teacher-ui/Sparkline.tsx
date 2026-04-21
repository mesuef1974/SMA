import * as React from "react";

export type SparklineProps = {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Tiny area sparkline — default 80×24, matches the design-handoff spec.
 * Uses a linear gradient fill under the stroke path.
 */
export function Sparkline({
  points,
  color = "var(--primary)",
  width = 80,
  height = 24,
  className,
}: SparklineProps) {
  const safePoints = points.length >= 2 ? points : [0, 0];
  const max = Math.max(...safePoints);
  const min = Math.min(...safePoints);
  const range = Math.max(1, max - min);
  const step = width / (safePoints.length - 1);
  const path = safePoints
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const areaPath = `${path} L${width},${height} L0,${height} Z`;
  const gradId = React.useId().replace(/:/g, "");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sp-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sp-${gradId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Sparkline;
