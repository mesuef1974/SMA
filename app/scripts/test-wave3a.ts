/**
 * Wave 3A verification — 3-layer source injection + per-period timing.
 * Builds the system prompt locally (no Claude API) and runs 6 assertions.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { writeFileSync } from 'node:fs';

async function main() {
  const { db } = await import('../src/db');
  const { getLessonById, getMisconceptionStats } = await import('../src/db/queries');
  const {
    getGuidePhilosophy,
    getUnitIntro,
    getLessonContent,
  } = await import('../src/db/queries/curriculum-sources');
  const { getSemesterPlan } = await import('../src/db/queries/semester-plan');
  const { buildSystemPrompt } = await import('../src/lib/lesson-plans/prompt');
  type LessonContext = import('../src/lib/lesson-plans/prompt').LessonContext;
  type CurriculumSourceWithPages = import('../src/db/queries/curriculum-sources').CurriculumSourceWithPages;

  // 1. Lookup lesson id for 5-1
  const rows = await db.execute(sql`SELECT id FROM lessons WHERE number = '5-1' LIMIT 1`);
  const lessonRow = (rows as unknown as Array<{ id: string }>)[0];
  if (!lessonRow) {
    console.error('FATAL: lesson 5-1 not found');
    process.exit(1);
  }
  const lessonId = lessonRow.id;

  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    console.error('FATAL: getLessonById returned null');
    process.exit(1);
  }

  const misconceptionData = await getMisconceptionStats(lessonId);

  const lessonNumSuffix = Number.parseInt(
    String(lesson.number).split('-').pop() ?? '',
    10,
  );
  const unitNumber = lesson.chapter?.number ?? 0;
  const [guideSource, unitSource, teLessonSource, seLessonSource, semesterPlan] =
    await Promise.all([
      getGuidePhilosophy(),
      unitNumber > 0 ? getUnitIntro(unitNumber, 'TE') : Promise.resolve(null),
      unitNumber > 0 && Number.isFinite(lessonNumSuffix)
        ? getLessonContent(unitNumber, lessonNumSuffix, 'TE')
        : Promise.resolve(null),
      unitNumber > 0 && Number.isFinite(lessonNumSuffix)
        ? getLessonContent(unitNumber, lessonNumSuffix, 'SE')
        : Promise.resolve(null),
      getSemesterPlan(),
    ]);

  const sourceToText = (s: CurriculumSourceWithPages | null): string | undefined =>
    s?.pages.length
      ? s.pages.map((p) => `--- صفحة ${p.pageNumber} ---\n${p.contentAr ?? ''}`).join('\n\n')
      : undefined;

  const teacherGuidePages =
    lesson.pageStartTe && lesson.pageEndTe
      ? `${lesson.pageStartTe}-${lesson.pageEndTe}`
      : undefined;
  const studentBookPages =
    lesson.pageStartSe && lesson.pageEndSe
      ? `${lesson.pageStartSe}-${lesson.pageEndSe}`
      : undefined;

  const context: LessonContext = {
    lessonTitleAr: lesson.titleAr,
    lessonTitleEn: lesson.title,
    chapterNumber: lesson.chapter?.number ?? 0,
    chapterTitleAr: lesson.chapter?.titleAr ?? '',
    periodNumber: 2,
    teacherGuidePages,
    studentBookPages,
    learningOutcomes: (lesson.learningOutcomes ?? []).map((lo) => ({
      descriptionAr: lo.descriptionAr,
      bloomLevel: lo.bloomLevel,
    })),
    misconceptions: misconceptionData.map((m) => ({
      nameAr: m.nameAr,
      descriptionAr: null,
      remediationHintAr: null,
    })),
    guidePhilosophy: sourceToText(guideSource),
    unitOverview: sourceToText(unitSource),
    lessonSourceTe: sourceToText(teLessonSource),
    lessonSourceSe: sourceToText(seLessonSource),
    semesterPlan,
  };

  const prompt = buildSystemPrompt(context);
  const outPath = 'D:/SMA/docs/test-wave3a-output.txt';
  writeFileSync(outPath, prompt, 'utf8');
  console.log(`wrote prompt (${prompt.length} chars) → ${outPath}`);
  console.log(
    `sources loaded: guide=${!!guideSource} unit=${!!unitSource} te=${!!teLessonSource} se=${!!seLessonSource} semesterPlan=${!!semesterPlan}`,
  );

  // Assertions
  const assertions: { id: string; desc: string; pass: boolean }[] = [];
  const push = (id: string, desc: string, pass: boolean) =>
    assertions.push({ id, desc, pass });

  push('A1', 'prompt يحوي <source_materials>', prompt.includes('<source_materials>'));
  push(
    'A2',
    'prompt يحوي الأربع طبقات (guide_philosophy, unit_overview, lesson_source_te, lesson_source_se)',
    prompt.includes('<guide_philosophy>') &&
      prompt.includes('<unit_overview>') &&
      prompt.includes('<lesson_source_te>') &&
      prompt.includes('<lesson_source_se>'),
  );
  push(
    'A3',
    'prompt لا يحوي fallback notice (كل المصادر محمّلة)',
    !prompt.includes('(لم يُحمَّل هذا المصدر من قاعدة البيانات — لا تخترع محتوى)'),
  );
  // Extract <timing>...</timing> block and verify period 2 only appears there
  const timingMatch = prompt.match(/<timing>([\s\S]*?)<\/timing>/);
  const timingBlock = timingMatch?.[1] ?? '';
  push(
    'A4',
    '<timing> block يذكر الحصة 2 ولا يذكر الحصة 1',
    timingBlock.includes('للحصة رقم 2') &&
      timingBlock.includes('للحصة 2)') &&
      !timingBlock.includes('للحصة رقم 1') &&
      !timingBlock.includes('للحصة 1)'),
  );
  push('A5', 'prompt يحوي فاصلات صفحات OCR (--- صفحة)', prompt.includes('--- صفحة'));
  push('A6', 'طول الـ prompt > 10,000 حرف', prompt.length > 10_000);
  push('A7', 'prompt يحوي <semester_plan> كطبقة مصدر خامسة', prompt.includes('<semester_plan>'));

  console.log('\n=== Assertions ===');
  for (const a of assertions) {
    console.log(`${a.pass ? 'PASS' : 'FAIL'} ${a.id}: ${a.desc}`);
  }
  const passed = assertions.filter((a) => a.pass).length;
  const total = assertions.length;
  console.log(`\nSummary: ${passed}/${total} PASS`);
  if (passed < total) {
    console.log('Failed:', assertions.filter((a) => !a.pass).map((a) => a.id).join(', '));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
