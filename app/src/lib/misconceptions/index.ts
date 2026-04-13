export {
  MISCONCEPTION_CATALOG,
  getMisconceptionByCode,
  getMisconceptionsByCategory,
  buildCatalogPromptReference,
  type MisconceptionEntry,
  type MisconceptionExample,
} from './catalog';

export {
  detectMisconceptions,
  quickPatternCheck,
  type DetectionResult,
  type DetectedMisconception,
  type DetectionContext,
  type PatternMatch,
} from './detector';
