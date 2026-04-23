/**
 * Semester plan loader — reads the official Ministry of Education
 * Term 2 semester plan (Grade 11 Literary, 2025-2026) from disk and
 * caches it in-process.
 *
 * The plan is the 5th source layer injected into the lesson-plan
 * generation system prompt (after guidePhilosophy, unitOverview,
 * lessonSourceTe, lessonSourceSe). It defines the official scope of
 * the curriculum — including which lessons are "enrichment" (full
 * lessons excluded from mandatory coverage).
 *
 * Source file: D:/SMA/docs/plan.txt (plain UTF-8 text).
 * If the file is missing, we return undefined and the generator
 * renders its standard fallback notice — we never throw.
 */
import { readFile } from 'node:fs/promises';

const PLAN_PATH = 'D:/SMA/docs/plan.txt';

// Module-level cache. One read per process lifetime.
// `undefined` = not yet attempted. `null` = attempted and missing.
let cached: string | null | undefined = undefined;

/**
 * Return the semester-plan text, or undefined when the source file is
 * absent. Never throws — a missing plan is a recoverable condition
 * that the prompt builder renders as a "source not loaded" notice.
 */
export async function getSemesterPlan(): Promise<string | undefined> {
  if (cached !== undefined) {
    return cached === null ? undefined : cached;
  }
  try {
    const text = await readFile(PLAN_PATH, 'utf8');
    cached = text;
    return text;
  } catch {
    cached = null;
    return undefined;
  }
}
