/**
 * Bloom Taxonomy keywords reference in Arabic and English.
 * Used for keyword detection and prompt engineering in the Bloom classifier.
 *
 * Based on the revised Bloom's Taxonomy (Anderson & Krathwohl, 2001)
 * with Arabic verbs aligned to Qatar Grade 11 Literary math context.
 */

export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export interface BloomLevelInfo {
  ar: string[];
  en: string[];
  label_ar: string;
  label_en: string;
}

export const BLOOM_KEYWORDS: Record<BloomLevel, BloomLevelInfo> = {
  remember: {
    ar: ['يعرّف', 'يسمّي', 'يذكر', 'يعدّد', 'يحدّد', 'يصف'],
    en: ['define', 'list', 'name', 'recall', 'identify', 'describe'],
    label_ar: 'التذكر',
    label_en: 'Remember',
  },
  understand: {
    ar: ['يفسّر', 'يشرح', 'يلخّص', 'يقارن', 'يوضّح', 'يترجم'],
    en: ['explain', 'summarize', 'compare', 'interpret', 'illustrate', 'translate'],
    label_ar: 'الفهم',
    label_en: 'Understand',
  },
  apply: {
    ar: ['يطبّق', 'يحسب', 'يحلّ', 'يستخدم', 'ينفّذ', 'يوظّف'],
    en: ['apply', 'calculate', 'solve', 'use', 'execute', 'implement'],
    label_ar: 'التطبيق',
    label_en: 'Apply',
  },
  analyze: {
    ar: ['يحلّل', 'يميّز', 'يقارن', 'يصنّف', 'يستنتج', 'يفكّك'],
    en: ['analyze', 'distinguish', 'compare', 'classify', 'infer', 'deconstruct'],
    label_ar: 'التحليل',
    label_en: 'Analyze',
  },
  evaluate: {
    ar: ['يقيّم', 'يبرّر', 'ينتقد', 'يحكم', 'يقرّر', 'يثبت'],
    en: ['evaluate', 'justify', 'critique', 'judge', 'decide', 'prove'],
    label_ar: 'التقويم',
    label_en: 'Evaluate',
  },
  create: {
    ar: ['يصمّم', 'يبتكر', 'يؤلّف', 'يخطّط', 'ينشئ', 'يطوّر'],
    en: ['design', 'create', 'compose', 'plan', 'construct', 'develop'],
    label_ar: 'الإبداع',
    label_en: 'Create',
  },
} as const;

/**
 * Returns an ordered list of Bloom levels from lowest to highest.
 */
export const BLOOM_LEVELS_ORDERED: BloomLevel[] = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
];

/**
 * Builds a formatted Arabic reference string for all Bloom levels and their keywords.
 * Used in AI prompts to provide context for classification.
 */
export function buildBloomPromptReference(): string {
  return BLOOM_LEVELS_ORDERED.map((level, index) => {
    const info = BLOOM_KEYWORDS[level];
    return `${index + 1}. ${info.label_ar} (${info.label_en}): ${info.ar.join('، ')}`;
  }).join('\n');
}
