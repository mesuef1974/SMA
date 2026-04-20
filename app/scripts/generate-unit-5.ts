/**
 * Generate all 8 lesson plans for unit 5 (lessons 5-1..5-4, periods 1 & 2).
 * Uses Ollama locally — no external API cost.
 * Persists to DB with status='draft', advisor_gate='pending'.
 *
 * Skips lesson plans that already exist (lessonId + periodNumber unique).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

const TEACHER_ID = '10089cca-dab0-4416-898c-ff99ae68d397';

async function main() {
  const { db } = await import('../src/db');
  const { getLessonById, getMisconceptionStats, createLessonPlan } = await import('../src/db/queries');
  const { getLessonContent } = await import('../src/db/queries/curriculum-sources');
  const { buildSystemPrompt } = await import('../src/lib/lesson-plans/prompt');
  const { lessonPlanSchema } = await import('../src/lib/lesson-plans/schema');
  const { filterToLatinNumerals } = await import('../src/lib/lesson-plans/numeral-filter');
  const { validateTripleGate, validateSourceTraceability } = await import(
    '../src/lib/lesson-plans/triple-gate'
  );
  const { generateLessonPlan } = await import('../src/lib/ai/generate-lesson-plan');
  const { OLLAMA_MODEL } = await import('../src/lib/ai/provider');
  type CurriculumSourceWithPages =
    import('../src/db/queries/curriculum-sources').CurriculumSourceWithPages;
  type LessonContext = import('../src/lib/lesson-plans/prompt').LessonContext;

  console.log(`model=${OLLAMA_MODEL} teacher=${TEACHER_ID}`);

  const lessons = (await db.execute(
    sql`SELECT l.id, l.number FROM lessons l JOIN chapters c ON l.chapter_id = c.id
        WHERE c.number = 5 AND l.number IN ('5-1','5-2','5-3','5-4') ORDER BY l.number`,
  )) as Array<{ id: string; number: string }>;
  console.log(`lessons found: ${lessons.map(l => l.number).join(', ')}`);

  type Result = { lesson: string; period: number; status: string; ms: number; notes?: string };
  const results: Result[] = [];

  for (const lrow of lessons) {
    const lesson = await getLessonById(lrow.id);
    if (!lesson) { console.log(`skip ${lrow.number}: not found`); continue; }
    const unitN = lesson.chapter?.number ?? 0;
    const lessonNumSuffix = Number.parseInt(String(lesson.number).split('-').pop() ?? '', 10);
    const misc = await getMisconceptionStats(lrow.id);

    const [te, se] = await Promise.all([
      getLessonContent(unitN, lessonNumSuffix, 'TE'),
      getLessonContent(unitN, lessonNumSuffix, 'SE'),
    ]);
    const toText = (s: CurriculumSourceWithPages | null) =>
      s?.pages.length
        ? s.pages.map((p) => `--- صفحة ${p.pageNumber} ---\n${p.contentAr ?? ''}`).join('\n\n')
        : undefined;

    for (const periodNumber of [1, 2] as const) {
      const exists = (await db.execute(
        sql`SELECT id FROM lesson_plans WHERE lesson_id = ${lrow.id} AND period_number = ${periodNumber} LIMIT 1`,
      )) as Array<{ id: string }>;
      if (exists.length > 0) {
        console.log(`⏭  skip ${lrow.number} P${periodNumber}: already exists`);
        results.push({ lesson: lrow.number, period: periodNumber, status: 'skipped', ms: 0 });
        continue;
      }

      const ctx: LessonContext = {
        lessonTitleAr: lesson.titleAr,
        lessonTitleEn: lesson.title,
        chapterNumber: unitN,
        chapterTitleAr: lesson.chapter?.titleAr ?? '',
        periodNumber,
        teacherGuidePages: lesson.pageStartTe && lesson.pageEndTe ? `${lesson.pageStartTe}-${lesson.pageEndTe}` : undefined,
        studentBookPages: lesson.pageStartSe && lesson.pageEndSe ? `${lesson.pageStartSe}-${lesson.pageEndSe}` : undefined,
        learningOutcomes: (lesson.learningOutcomes ?? []).map((lo) => ({
          descriptionAr: lo.descriptionAr, bloomLevel: lo.bloomLevel,
        })),
        misconceptions: misc.map((m) => ({ nameAr: m.nameAr, descriptionAr: null, remediationHintAr: null })),
        guidePhilosophy: undefined,
        unitOverview: undefined,
        lessonSourceTe: toText(te),
        lessonSourceSe: toText(se),
        semesterPlan: null,
      };

      const prompt = buildSystemPrompt(ctx);
      const userPrompt =
        `ولّد خطة الحصة ${periodNumber} لدرس ${ctx.lessonTitleAr}.\n\n` +
        `## قواعد صارمة:\n` +
        `1. **teacher_guide_page** يجب أن يكون رقم صفحة فعلي في دليل المعلم ضمن المدى [${lesson.pageStartTe}-${lesson.pageEndTe}].\n` +
        `2. **qncf_code** لهذه الوحدة (الإحصاء) يستخدم رمز "STA" (3 أحرف). مثال: QNCF-G11-M-STA-001. ممنوع "DATA".`;

      const tag = `${lrow.number} P${periodNumber}`;
      console.log(`\n[${new Date().toISOString()}] ▶ ${tag}  prompt=${prompt.length} chars`);
      const t0 = Date.now();
      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), 600_000);
      const hb = setInterval(() => {
        console.log(`  …${tag} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }, 30_000);

      try {
        const result = await generateLessonPlan({
          schema: lessonPlanSchema,
          systemPrompt: prompt,
          userPrompt,
          temperature: 0.3,
          abortSignal: abort.signal,
        });
        clearInterval(hb); clearTimeout(timeout);
        const ms = Date.now() - t0;

        let sectionData = filterToLatinNumerals(result.object) as typeof result.object;

        // Unit sanity check
        if (sectionData.header.unit_number !== unitN) {
          console.log(`❌ ${tag} unit mismatch: got ${sectionData.header.unit_number}`);
          results.push({ lesson: lrow.number, period: periodNumber, status: 'unit_mismatch', ms });
          continue;
        }

        const tg = validateTripleGate(sectionData);
        const tr = validateSourceTraceability(sectionData, {
          pageStartTe: lesson.pageStartTe, pageEndTe: lesson.pageEndTe,
        });
        if (!tr.passed) {
          tg.failure_reasons.push(...tr.reasons);
          tg.results.failure_reasons.push(...tr.reasons);
        }

        const status = (!tg.passed || !tr.passed) ? 'rejected_gate' : 'draft';
        sectionData.gate_results = tg.results;

        const plan = await createLessonPlan({
          lessonId: lrow.id,
          teacherId: TEACHER_ID,
          periodNumber,
          status,
          sectionData: status === 'rejected_gate'
            ? { ...sectionData, gate_results: tg.results }
            : sectionData,
          aiSuggestions: {
            model: OLLAMA_MODEL,
            generatedAt: new Date().toISOString(),
            gate_status: status,
            gate_failures: !tg.passed || !tr.passed ? tg.failure_reasons : undefined,
          },
        });
        console.log(`✅ ${tag} ${status} in ${(ms / 1000).toFixed(1)}s  id=${plan?.id}`);
        results.push({
          lesson: lrow.number, period: periodNumber,
          status, ms,
          notes: status === 'rejected_gate' ? tg.failure_reasons.slice(0, 3).join(' | ') : undefined,
        });
      } catch (e) {
        clearInterval(hb); clearTimeout(timeout);
        const ms = Date.now() - t0;
        const msg = (e as Error).message?.slice(0, 200) ?? 'unknown';
        console.log(`❌ ${tag} FAILED in ${(ms / 1000).toFixed(1)}s: ${msg}`);
        results.push({ lesson: lrow.number, period: periodNumber, status: 'error', ms, notes: msg });
      }
    }
  }

  console.log('\n========== SUMMARY ==========');
  console.table(results);
  const ok = results.filter(r => r.status === 'draft').length;
  const rej = results.filter(r => r.status === 'rejected_gate').length;
  const err = results.filter(r => r.status === 'error').length;
  const skip = results.filter(r => r.status === 'skipped').length;
  console.log(`draft=${ok}  rejected_gate=${rej}  error=${err}  skipped=${skip}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
