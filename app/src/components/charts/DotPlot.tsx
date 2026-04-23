'use client';

interface DotPlotProps {
  data?: number[];
  min?: number;
  max?: number;
  title?: string;
  xLabel?: string;
  dotColor?: string;
  width?: number;
}

const DEFAULT_DATA = [12, 12, 13, 14, 14, 14, 15, 15, 15, 16, 16, 17, 17, 18, 18];

export default function DotPlot({
  data = DEFAULT_DATA,
  min = 11,
  max = 20,
  title,
  xLabel,
  dotColor = '#1d4ed8',
  width = 500,
}: DotPlotProps) {
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 20;
  const paddingBottom = 40;
  const axisY = height - paddingBottom;
  const plotWidth = width - paddingLeft - paddingRight;
  const range = max - min;
  const step = plotWidth / range;
  const dotRadius = 7;
  const dotSpacing = 16;

  const counts: Record<number, number> = {};
  for (const v of data) {
    counts[v] = (counts[v] ?? 0) + 1;
  }

  const dots: { cx: number; cy: number }[] = [];
  for (const [valStr, count] of Object.entries(counts)) {
    const val = Number(valStr);
    const cx = paddingLeft + (val - min) * step;
    for (let i = 0; i < count; i++) {
      const cy = axisY - dotRadius - i * dotSpacing;
      dots.push({ cx, cy });
    }
  }

  const ticks: number[] = [];
  for (let v = min; v <= max; v++) ticks.push(v);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title ?? 'مخطط النقاط'}
    >
      {title && (
        <text
          x={width / 2}
          y={16}
          textAnchor="middle"
          fontSize={13}
          fontWeight="600"
          fill="#1e293b"
        >
          {title}
        </text>
      )}

      <line x1={paddingLeft} y1={axisY} x2={paddingLeft + plotWidth} y2={axisY} stroke="#374151" strokeWidth={1.5} />

      {ticks.map((v) => {
        const x = paddingLeft + (v - min) * step;
        return (
          <g key={v}>
            <line x1={x} y1={axisY} x2={x} y2={axisY + 5} stroke="#374151" strokeWidth={1} />
            <text x={x} y={axisY + 17} textAnchor="middle" fontSize={11} fill="#374151">
              {v}
            </text>
          </g>
        );
      })}

      {xLabel && (
        <text x={paddingLeft + plotWidth / 2} y={height - 4} textAnchor="middle" fontSize={11} fill="#6b7280">
          {xLabel}
        </text>
      )}

      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={dotRadius} fill={dotColor} />
      ))}
    </svg>
  );
}
