'use client';

/**
 * VisualAidsSlide — generic, data-driven visual-aids slide for the
 * presentation view.
 *
 * Reads the per-lesson config from `visual-aids-registry.ts` and dispatches
 * each descriptor to a renderer via `CHART_RENDERERS`. The slide is NOT
 * rendered by the caller when `getVisualAidsForLesson` returns `null`, so
 * we never emit a placeholder for lessons that have no visual aids.
 *
 * Renderer accent colors rotate so adjacent charts are visually distinct.
 */

import DotPlot from '@/components/charts/DotPlot';
import BoxWhiskerPlot from '@/components/charts/BoxWhiskerPlot';
import Histogram from '@/components/charts/Histogram';
import type {
  VisualAidDescriptor,
  VisualAidsConfig,
} from '@/lib/lesson-plans/visual-aids-registry';

// ---------------------------------------------------------------------------
// Chart renderers (dispatch map)
// ---------------------------------------------------------------------------

const CHART_WIDTH = 340;

function ChartRenderer({ descriptor }: { descriptor: VisualAidDescriptor }) {
  switch (descriptor.kind) {
    case 'dot_plot':
      return (
        <DotPlot
          width={CHART_WIDTH}
          data={descriptor.data}
          min={descriptor.min}
          max={descriptor.max}
          xLabel={descriptor.xLabel}
        />
      );
    case 'box_whisker':
      return (
        <BoxWhiskerPlot
          width={CHART_WIDTH}
          min={descriptor.min}
          q1={descriptor.q1}
          median={descriptor.median}
          q3={descriptor.q3}
          max={descriptor.max}
        />
      );
    case 'histogram':
      return (
        <Histogram
          width={CHART_WIDTH}
          intervals={descriptor.intervals}
          xLabel={descriptor.xLabel}
          yLabel={descriptor.yLabel}
        />
      );
  }
}

// Rotating accent colors for chart titles — keeps the 3-chart lesson 5-1
// layout visually identical to the original (blue / emerald / amber) and
// degrades gracefully for future lessons with more or fewer charts.
const ACCENT_CLASSES = [
  'text-blue-300',
  'text-emerald-300',
  'text-amber-300',
  'text-purple-300',
  'text-rose-300',
];

// ---------------------------------------------------------------------------
// Slide
// ---------------------------------------------------------------------------

export function VisualAidsSlide({ config }: { config: VisualAidsConfig }) {
  return (
    <div className="flex h-full flex-col justify-start gap-4 px-4 overflow-y-auto py-2">
      <h2 className="text-3xl font-bold text-center md:text-4xl shrink-0">
        {config.titleAr}
      </h2>
      {config.subtitleAr && (
        <p className="text-lg text-zinc-400 text-center shrink-0">
          {config.subtitleAr}
        </p>
      )}
      <div className="flex flex-col xl:flex-row items-center justify-center gap-6 flex-1 min-h-0">
        {config.charts.map((descriptor, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 shrink-0"
          >
            <h3
              className={`text-xl font-semibold ${
                ACCENT_CLASSES[i % ACCENT_CLASSES.length]
              }`}
            >
              {descriptor.titleAr}
            </h3>
            <div className="rounded-xl bg-white/5 p-3 overflow-hidden">
              <ChartRenderer descriptor={descriptor} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
