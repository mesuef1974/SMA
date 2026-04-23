/**
 * Visual Aids Registry — per-lesson visual aids for the presentation view.
 *
 * The lesson-plan Zod schema has no `visual_aids` field (see `./schema.ts`),
 * and the DB `lessons` table does not carry renderable visual-aid data
 * either. Rather than introducing a DB migration or polluting the AI-
 * generated plan schema, we keep a small, hand-curated map keyed by
 * `lesson.id` (UUID). Each entry is a list of chart descriptors that the
 * generic `VisualAidsSlide` component dispatches through a renderer
 * registry (DotPlot / BoxWhiskerPlot / Histogram).
 *
 * HOW TO ADD A NEW LESSON:
 *   1. Import nothing; this file is pure data.
 *   2. Add a new key (the lesson UUID) to `VISUAL_AIDS_REGISTRY` below.
 *   3. Populate `charts` with one or more `VisualAidDescriptor`s.
 *   4. If you need a chart kind that doesn't exist yet, add a new
 *      discriminant to `VisualAidDescriptor` and extend the renderer map
 *      in `components/lesson-plan/visual-aids-slide.tsx`.
 *
 * If a lesson has no entry (or `charts` is empty), NO visual-aids slide
 * is rendered — we don't emit a placeholder.
 */

// ---------------------------------------------------------------------------
// Descriptors
// ---------------------------------------------------------------------------

export interface DotPlotDescriptor {
  kind: 'dot_plot';
  titleAr: string;
  data?: number[];
  min?: number;
  max?: number;
  xLabel?: string;
}

export interface BoxWhiskerDescriptor {
  kind: 'box_whisker';
  titleAr: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export interface HistogramDescriptor {
  kind: 'histogram';
  titleAr: string;
  intervals?: { label: string; freq: number }[];
  xLabel?: string;
  yLabel?: string;
}

export type VisualAidDescriptor =
  | DotPlotDescriptor
  | BoxWhiskerDescriptor
  | HistogramDescriptor;

export interface VisualAidsConfig {
  /** Arabic title shown as the slide H2. */
  titleAr: string;
  /** Optional Arabic subtitle / dataset caption. */
  subtitleAr?: string;
  charts: VisualAidDescriptor[];
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const LESSON_5_1_ID = '0f3d5c6d-f8e7-4b24-b1e7-528653eafc36';

export const VISUAL_AIDS_REGISTRY: Record<string, VisualAidsConfig> = {
  [LESSON_5_1_ID]: {
    titleAr: 'الوسائل التعليمية — تمثيل البيانات',
    subtitleAr: 'درجات 15 طالباً من 20',
    charts: [
      {
        kind: 'dot_plot',
        titleAr: 'التمثيل بالنقاط',
        xLabel: 'الدرجة من 20',
      },
      {
        kind: 'box_whisker',
        titleAr: 'مخطط الصندوق وطرفيه',
        min: 12,
        q1: 14,
        median: 15,
        q3: 17,
        max: 18,
      },
      {
        kind: 'histogram',
        titleAr: 'المدرج التكراري',
        xLabel: 'فئات الدرجات',
        yLabel: 'التكرار',
      },
    ],
  },
};

/**
 * Look up visual aids for a lesson. Returns `null` when the lesson has no
 * configured visual aids — the caller should skip the slide entirely.
 */
export function getVisualAidsForLesson(
  lessonId: string,
): VisualAidsConfig | null {
  const config = VISUAL_AIDS_REGISTRY[lessonId];
  if (!config || config.charts.length === 0) return null;
  return config;
}
