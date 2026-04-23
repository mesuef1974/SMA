'use client';

interface Interval {
  label: string;
  freq: number;
}

interface HistogramProps {
  intervals?: Interval[];
  title?: string;
  yLabel?: string;
  xLabel?: string;
  barColor?: string;
  width?: number;
}

const DEFAULT_INTERVALS: Interval[] = [
  { label: '12-14', freq: 3 },
  { label: '14-16', freq: 6 },
  { label: '16-18', freq: 4 },
  { label: '18-20', freq: 2 },
];

export default function Histogram({
  intervals = DEFAULT_INTERVALS,
  title,
  yLabel = 'التكرار',
  xLabel = 'الدرجات',
  barColor = '#3b82f6',
  width = 500,
}: HistogramProps) {
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingBottom = 50;
  const paddingTop = title ? 36 : 16;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const maxFreq = 7;
  const yTicks = [0, 1, 2, 3, 4, 5, 6, 7];
  const barWidth = plotWidth / intervals.length;

  const scaleY = (v: number) => paddingTop + plotHeight - (v / maxFreq) * plotHeight;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title ?? 'المدرج التكراري'}
    >
      {title && (
        <text x={width / 2} y={20} textAnchor="middle" fontSize={13} fontWeight="600" fill="#1e293b">
          {title}
        </text>
      )}

      {/* Grid lines + y-axis ticks */}
      {yTicks.map((v) => {
        const y = scaleY(v);
        return (
          <g key={v}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={paddingLeft + plotWidth}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fontSize={11} fill="#374151">
              {v}
            </text>
          </g>
        );
      })}

      {/* y-axis label */}
      <text
        x={14}
        y={paddingTop + plotHeight / 2}
        textAnchor="middle"
        fontSize={11}
        fill="#6b7280"
        transform={`rotate(-90, 14, ${paddingTop + plotHeight / 2})`}
      >
        {yLabel}
      </text>

      {/* Bars */}
      {intervals.map((interval, i) => {
        const x = paddingLeft + i * barWidth;
        const barH = (interval.freq / maxFreq) * plotHeight;
        const y = paddingTop + plotHeight - barH;
        return (
          <g key={interval.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={barColor}
              stroke="#1d4ed8"
              strokeWidth={1}
            />
            {/* Frequency label above bar */}
            <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize={11} fontWeight="600" fill="#1d4ed8">
              {interval.freq}
            </text>
            {/* Interval label below x-axis */}
            <text
              x={x + barWidth / 2}
              y={paddingTop + plotHeight + 16}
              textAnchor="middle"
              fontSize={11}
              fill="#374151"
            >
              {interval.label}
            </text>
          </g>
        );
      })}

      {/* Axes */}
      <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + plotHeight} stroke="#374151" strokeWidth={1.5} />
      <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={paddingLeft + plotWidth} y2={paddingTop + plotHeight} stroke="#374151" strokeWidth={1.5} />

      {/* x-axis label */}
      <text x={paddingLeft + plotWidth / 2} y={height - 6} textAnchor="middle" fontSize={11} fill="#6b7280">
        {xLabel}
      </text>
    </svg>
  );
}
