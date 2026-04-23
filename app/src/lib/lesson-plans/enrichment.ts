/**
 * Full-enrichment lesson list per the official semester plan
 * (وزارة التربية، Term 2, Grade 11 Literary, 2025-2026).
 *
 * These lessons are marked by the ministry as enrichment in their
 * entirety — no lesson plan should be generated for them. This differs
 * from the per-section `extend` block in the 5E template, which is a
 * small optional enrichment slice inside an otherwise-mandatory lesson.
 *
 * Source: D:/SMA/docs/plan.txt
 */
export const FULL_ENRICHMENT_LESSONS = ['3-2', '3-4', '5-5'] as const;

export function isFullEnrichmentLesson(lessonNumber: string): boolean {
  return (FULL_ENRICHMENT_LESSONS as readonly string[]).includes(lessonNumber);
}
