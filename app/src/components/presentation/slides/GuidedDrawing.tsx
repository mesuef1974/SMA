'use client';

/**
 * GuidedDrawing — students click on a number line to place dots for a given
 * dataset. Wrong placements shake + give feedback; correct placements stick.
 *
 * In teacher mode, a "كشف الرسم الصحيح" button reveals all missing dots in an
 * alternate color.
 *
 * Only 'dotplot' is implemented in the first wave; 'boxplot' falls back to a
 * read-only preview message.
 */

import { useMemo, useState } from 'react';
import { useTeacherMode } from '../teacher-mode-context';
import { cn } from '@/lib/utils';

interface GuidedDrawingProps {
  data: number[];
  chartType?: 'dotplot' | 'boxplot';
  min: number;
  max: number;
  label?: string;
  width?: number;
}

const PLOT_HEIGHT = 220;
const PADDING_L = 36;
const PADDING_R = 24;
const PADDING_B = 48;
const DOT_R = 9;
const DOT_GAP = 4;
const TOLERANCE_PX = 14;

export function GuidedDrawing({
  data,
  chartType = 'dotplot',
  min,
  max,
  label,
  width = 640,
}: GuidedDrawingProps) {
  const { isTeacher } = useTeacherMode();
  const plotW = width - PADDING_L - PADDING_R;
  const axisY = PLOT_HEIGHT - PADDING_B;

  const expectedCounts = useMemo(() => {
    const m = new Map<number, number>();
    for (const v of data) m.set(v, (m.get(v) ?? 0) + 1);
    return m;
  }, [data]);

  const [placed, setPlaced] = useState<Map<number, number>>(new Map());
  const [shake, setShake] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [showTruth, setShowTruth] = useState(false);

  const xFor = (v: number) =>
    PADDING_L + ((v - min) / Math.max(1, max - min)) * plotW;

  const valueForX = (x: number): number | null => {
    // Snap to nearest integer tick within tolerance
    const v = min + ((x - PADDING_L) / plotW) * (max - min);
    const snapped = Math.round(v);
    if (snapped < min || snapped > max) return null;
    const snappedX = xFor(snapped);
    if (Math.abs(snappedX - x) > TOLERANCE_PX) return null;
    return snapped;
  };

  const handleClick: React.MouseEventHandler<SVGSVGElement> = (e) => {
    if (chartType !== 'dotplot') return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const scale = width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    // Only accept clicks near the axis
    if (y > axisY + 30 || y < axisY - 140) {
      setMessage('انقر قرب خط الأعداد');
      setShake((s) => s + 1);
      return;
    }

    const snapped = valueForX(x);
    if (snapped == null) {
      setMessage('جرّب مرة أخرى — اقترب أكثر من تقسيمة صحيحة');
      setShake((s) => s + 1);
      return;
    }

    const expected = expectedCounts.get(snapped) ?? 0;
    const current = placed.get(snapped) ?? 0;
    if (current >= expected) {
      setMessage(`القيمة ${snapped} وصلت للعدد المطلوب`);
      setShake((s) => s + 1);
      return;
    }

    const next = new Map(placed);
    next.set(snapped, current + 1);
    setPlaced(next);
    setMessage(null);
  };

  const totalExpected = data.length;
  const totalPlaced = Array.from(placed.values()).reduce((a, b) => a + b, 0);
  const complete = totalPlaced === totalExpected;

  // Build ticks
  const ticks: number[] = [];
  for (let v = min; v <= max; v++) ticks.push(v);

  const renderDotsFor = (
    counts: Map<number, number>,
    color: 'student' | 'truth',
  ) => {
    const nodes: React.ReactNode[] = [];
    for (const [val, count] of counts.entries()) {
      for (let i = 0; i < count; i++) {
        const cx = xFor(val);
        const cy = axisY - DOT_R - i * (DOT_R * 2 + DOT_GAP);
        nodes.push(
          <circle
            key={`${color}-${val}-${i}`}
            cx={cx}
            cy={cy}
            r={DOT_R}
            className={
              color === 'truth'
                ? 'fill-[color:var(--sma-qamar-500)] opacity-70'
                : 'fill-blue-400'
            }
          />,
        );
      }
    }
    return nodes;
  };

  const truthCounts = useMemo(() => {
    if (!showTruth) return null;
    const diff = new Map<number, number>();
    for (const [v, need] of expectedCounts.entries()) {
      const have = placed.get(v) ?? 0;
      if (need > have) diff.set(v, need - have);
    }
    return diff;
  }, [showTruth, expectedCounts, placed]);

  if (chartType !== 'dotplot') {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center text-zinc-400">
        التفاعل المخصص لمخطط الصندوق سيُضاف في الموجة التالية.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {label && <p className="text-xl text-zinc-300 text-center">{label}</p>}

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>
          وُضع <span dir="ltr" className="font-mono">{totalPlaced} / {totalExpected}</span>
        </span>
        {complete && (
          <span className="text-emerald-400" role="status">
            ✓ اكتمل الرسم
          </span>
        )}
      </div>

      <div
        key={shake}
        className={cn('rounded-xl bg-white/5 border border-white/10 p-2', shake ? 'animate-[shake_0.35s]' : '')}
        style={
          {
            // inline keyframes injection fallback
          }
        }
      >
        <svg
          viewBox={`0 0 ${width} ${PLOT_HEIGHT}`}
          width="100%"
          className="cursor-crosshair select-none"
          onClick={handleClick}
          role="img"
          aria-label="خط أعداد تفاعلي لرسم التمثيل بالنقاط"
        >
          {/* axis */}
          <line
            x1={PADDING_L}
            x2={width - PADDING_R}
            y1={axisY}
            y2={axisY}
            className="stroke-white/40"
            strokeWidth={2}
          />
          {ticks.map((t) => {
            const cx = xFor(t);
            return (
              <g key={t}>
                <line
                  x1={cx}
                  x2={cx}
                  y1={axisY}
                  y2={axisY + 6}
                  className="stroke-white/40"
                  strokeWidth={1.5}
                />
                <text
                  x={cx}
                  y={axisY + 22}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[12px] font-mono"
                >
                  {t}
                </text>
              </g>
            );
          })}
          {renderDotsFor(placed, 'student')}
          {truthCounts && renderDotsFor(truthCounts, 'truth')}
        </svg>
      </div>

      {message && (
        <p className="text-center text-sm text-amber-400" role="status">
          <span aria-hidden>⚠ </span>
          {message}
        </p>
      )}

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            setPlaced(new Map());
            setMessage(null);
            setShowTruth(false);
          }}
          className="rounded-lg bg-white/10 px-3 py-2 text-sm text-zinc-200 hover:bg-white/20"
        >
          ↺ مسح
        </button>
        {isTeacher && (
          <button
            type="button"
            onClick={() => setShowTruth((v) => !v)}
            className="rounded-lg bg-[color:var(--sma-qamar-500)]/25 border border-[color:var(--sma-qamar-500)]/60 px-3 py-2 text-sm text-[color:var(--sma-qamar-500)]"
          >
            {showTruth ? 'إخفاء الكشف' : 'كشف الرسم الصحيح'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
