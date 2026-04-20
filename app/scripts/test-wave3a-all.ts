/**
 * Wave 3A verification across ALL 15 lessons (units 3 + 4 + 5).
 * Confirms:
 *   - page_start_te/page_end_te non-null (BL-021 backfill)
 *   - lesson_content sources loaded for both TE + SE (BL-005 OCR ingest)
 *   - validateSourceTraceability does NOT fail-closed
 *   - prompt > 50KB (real OCR loaded, not just headers)
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  const { getLessonById } = await import('../src/db/queries');
  const {
    getGuidePhilosophy,
    getUnitIntro,
    getLessonContent,
  } = await import('../src/db/queries/curriculum-sources');
  const { getSemesterPlan } = await import('../src/db/queries/semester-plan');
  const { buildSystemPrompt } = await import('../src/lib/lesson-plans/prompt');
  const { validateSourceTraceability } = await import(
    '../src/lib/lesson-plans/triple-gate'
  );
  type LessonContext = import('../src/lib/lesson-plans/prompt').LessonContext;
  type CurriculumSourceWithPages =
    import('../src/db/queries/curriculum-sources').CurriculumSourceWithPages;

  const sourceToText = (s: CurriculumSourceWithPages | null): string | undefined =>
    s?.pages.length
      ? s.pages.map((p) => `--- صفحة ${p.pageNumber} ---\n${p.contentAr ?? ''}`).join('\n\n')
      : undefined;

  const lessons = (await db.execute(
    sql`SELECT id, number FROM lessons ORDER BY number`,
  )) as unknown as Array<{ id: string; number: string }>;

  console.log(`Testing ${lessons.length} lessons...\n`);
  const results: Array<{
    number: string;
    pageOk: boolean;
    teLoaded: boolean;
    seLoaded: boolean;
    promptLen: number;
    traceFailClosed: boolean;
  }> = [];

  const guideSource = await getGuidePhilosophy();
  const semesterPlan = await getSemesterPlan();

  for (const row of lessons) {
    const lesson = await getLessonById(row.id);
    if (!lesson) {
      results.push({
        number: row.number,
        pageOk: false,
        teLoaded: false,
        seLoaded: false,
        promptLen: 0,
        traceFailClosed: true,
      });
      continue;
    }
    const pageOk = !!(lesson.pageStartTe && lesson.pageEndTe);
    const unitNumber = lesson.chapter?.number ?? 0;
    const lessonNumSuffix = Number.parseInt(
      String(lesson.number).split('-').pop() ?? '',
      10,
    );
    const [unitSource, teLessonSource, seLessonSource] = await Promise.all([
      getUnitIntro(unitNumber, 'TE'),
      getLessonContent(unitNumber, lessonNumSuffix, 'TE'),
      getLessonContent(unitNumber, lessonNumSuffix, 'SE'),
    ]);

    const ctx: LessonContext = {
      lessonTitleAr: lesson.titleAr,
      lessonTitleEn: lesson.title,
      chapterNumber: unitNumber,
      chapterTitleAr: lesson.chapter?.titleAr ?? '',
      periodNumber: 1,
      teacherGuidePages:
        lesson.pageStartTe && lesson.pageEndTe
          ? `${lesson.pageStartTe}-${lesson.pageEndTe}`
          : undefined,
      studentBookPages:
        lesson.pageStartSe && lesson.pageEndSe
          ? `${lesson.pageStartSe}-${lesson.pageEndSe}`
          : undefined,
      learningOutcomes: [],
      misconceptions: [],
      guidePhilosophy: sourceToText(guideSource),
      unitOverview: sourceToText(unitSource),
      lessonSourceTe: sourceToText(teLessonSource),
      lessonSourceSe: sourceToText(seLessonSource),
      semesterPlan,
    };
    const prompt = buildSystemPrompt(ctx);

    // Simulate trace check with empty plan (we just want to see if it fail-closes on null pages)
    const trace = validateSourceTraceability(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { warm_up: { teacher_guide_page: lesson.pageStartTe ?? 999 } } as any,
      { pageStartTe: lesson.pageStartTe, pageEndTe: lesson.pageEndTe },
    );
    const traceFailClosed = trace.reasons.some((r) =>
      r.includes('بيانات الدرس ناقصة'),
    );

    results.push({
      number: row.number,
      pageOk,
      teLoaded: !!teLessonSource,
      seLoaded: !!seLessonSource,
      promptLen: prompt.length,
      traceFailClosed,
    });
  }

  console.table(results);

  const summary = {
    total: results.length,
    pagesOk: results.filter((r) => r.pageOk).length,
    teLoaded: results.filter((r) => r.teLoaded).length,
    seLoaded: results.filter((r) => r.seLoaded).length,
    avgPromptLen: Math.round(
      results.reduce((s, r) => s + r.promptLen, 0) / results.length,
    ),
    traceFailClosedCount: results.filter((r) => r.traceFailClosed).length,
  };
  console.log('\n=== Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  const allOk =
    summary.pagesOk === summary.total &&
    summary.teLoaded === summary.total &&
    summary.seLoaded === summary.total &&
    summary.traceFailClosedCount === 0 &&
    summary.avgPromptLen > 50_000;
  console.log(allOk ? '\n✅ ALL CHECKS PASS' : '\n❌ FAILURES DETECTED');
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
