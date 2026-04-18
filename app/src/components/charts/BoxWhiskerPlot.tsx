'use client';

interface BoxWhiskerProps {
  min?: number;
  q1?: number;
  median?: number;
  q3?: number;
  max?: number;
  dataMin?: number;
  dataMax?: number;
  title?: string;
  width?: number;
}

export default function BoxWhiskerPlot({
  min = 12,
  q1 = 14,
  median = 15,
  q3 = 17,
  max = 18,
  dataMin = 10,
  dataMax = 21,
  title,
  width = 500,
}: BoxWhiskerProps) {
  const height = 140;
  const paddingLeft = 30;
  const paddingRight = 20;
  const paddingBottom = 45;
  const axisY = height - paddingBottom;
  const plotWidth = width - paddingLeft - paddingRight;
  const boxHeight = 40;
  const boxTop = axisY - boxHeight;
  const boxMidY = axisY - boxHeight / 2;
  const whiskerCapH = 10;

  const scale = (v: number) => paddingLeft + ((v - dataMin) / (dataMax - dataMin)) * plotWidth;

  const xMin = scale(min);
  const xQ1 = scale(q1);
  const xMedian = scale(median);
  const xQ3 = scale(q3);
  const xMax = scale(max);

  const labels: { x: number; label: string; value: number }[] = [
    { x: xMin, label: 'Min', value: min },
    { x: xQ1, label: 'Q1', value: q1 },
    { x: xMedian, label: 'وسيط', value: median },
    { x: xQ3, label: 'Q3', value: q3 },
    { x: xMax, label: 'Max', value: max },
  ];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title ?? 'مخطط الصندوق والشارب'}
    >
      {title && (
        <text x={width / 2} y={16} textAnchor="middle" fontSize={13} fontWeight="600" fill="#1e293b">
          {title}
        </text>
      )}

      <line x1={paddingLeft} y1={axisY} x2={paddingLeft + plotWidth} y2={axisY} stroke="#374151" strokeWidth={1.5} />

      {/* Whisker: min to Q1 */}
      <line x1={xMin} y1={boxMidY} x2={xQ1} y2={boxMidY} stroke="#1d4ed8" strokeWidth={1.5} />
      {/* Left cap at min */}
      <line x1={xMin} y1={boxMidY - whiskerCapH / 2} x2={xMin} y2={boxMidY + whiskerCapH / 2} stroke="#1d4ed8" strokeWidth={1.5} />

      {/* Box Q1 to Q3 */}
      <rect x={xQ1} y={boxTop} width={xQ3 - xQ1} height={boxHeight} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={1.5} />

      {/* Median line */}
      <line x1={xMedian} y1={boxTop} x2={xMedian} y2={axisY} stroke="#1d4ed8" strokeWidth={2} />

      {/* Whisker: Q3 to max */}
      <line x1={xQ3} y1={boxMidY} x2={xMax} y2={boxMidY} stroke="#1d4ed8" strokeWidth={1.5} />
      {/* Right cap at max */}
      <line x1={xMax} y1={boxMidY - whiskerCapH / 2} x2={xMax} y2={boxMidY + whiskerCapH / 2} stroke="#1d4ed8" strokeWidth={1.5} />

      {/* Labels */}
      {labels.map(({ x, label, value }) => (
        <g key={label}>
          <text x={x} y={axisY + 14} textAnchor="middle" fontSize={10} fill="#374151">
            {label}
          </text>
          <text x={x} y={axisY + 26} textAnchor="middle" fontSize={10} fontWeight="600" fill="#1d4ed8">
            {value}
          </text>
        </g>
      ))}
    </svg>
  );
}
