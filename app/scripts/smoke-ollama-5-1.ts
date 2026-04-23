/**
 * Smoke test: generate lesson plan for 5-1 period 1 via Ollama.
 * No DB persist. Pure measurement.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

// Prompt-trim switches for Ollama (8GB VRAM, 16K ctx). Set to true to drop
// layer and keep only lesson-specific sources. Guide philosophy (40 pages,
// ~72KB) dominates prompt; lesson content stays intact. See measure-*.ts.
// Default false — 5-layer injection. Set to true only for Ollama 8GB VRAM runs
// where the 16K ctx window can't fit guide + unit overview + semester plan.
// See LL-SMA-005 for the root-cause of shallow pedagogical depth.
const DROP_GUIDE_PHILOSOPHY = false;
const DROP_UNIT_OVERVIEW = false;
const DROP_SEMESTER_PLAN = false;

async function main() {
  const t0 = Date.now();
  const { db } = await import('../src/db');
  const { getLessonById, getMisconceptionStats } = await import('../src/db/queries');
  const {
    getGuidePhilosophy, getUnitIntro, getLessonContent,
  } = await import('../src/db/queries/curriculum-sources');
  const { getSemesterPlan } = await import('../src/db/queries/semester-plan');
  const { buildSystemPrompt } = await import('../src/lib/lesson-plans/prompt');
  const { lessonPlanSchema } = await import('../src/lib/lesson-plans/schema');
  const { PROVIDER, OLLAMA_MODEL } = await import('../src/lib/ai/provider');
  const { generateLessonPlan } = await import('../src/lib/ai/generate-lesson-plan');
  const { validateTripleGate, validateSourceTraceability } = await import(
    '../src/lib/lesson-plans/triple-gate'
  );
  type CurriculumSourceWithPages =
    import('../src/db/queries/curriculum-sources').CurriculumSourceWithPages;
  type LessonContext = import('../src/lib/lesson-plans/prompt').LessonContext;

  console.log(`provider=${PROVIDER} model=${OLLAMA_MODEL}`);

  const rows = (await db.execute(
    sql`SELECT id FROM lessons WHERE number = '5-1' LIMIT 1`,
  )) as Array<{ id: string }>;
  const lessonId = rows[0]?.id;
  if (!lessonId) throw new Error('lesson 5-1 not found');

  const lesson = await getLessonById(lessonId);
  if (!lesson) throw new Error('getLessonById null');
  const misc = await getMisconceptionStats(lessonId);
  const unitN = lesson.chapter?.number ?? 0;

  const [guide, unit, te, se, plan] = await Promise.all([
    getGuidePhilosophy(),
    getUnitIntro(unitN, 'TE'),
    getLessonContent(unitN, 1, 'TE'),
    getLessonContent(unitN, 1, 'SE'),
    getSemesterPlan(),
  ]);

  const toText = (s: CurriculumSourceWithPages | null) =>
    s?.pages.length
      ? s.pages.map((p) => `--- صفحة ${p.pageNumber} ---\n${p.contentAr ?? ''}`).join('\n\n')
      : undefined;

  const ctx: LessonContext = {
    lessonTitleAr: lesson.titleAr,
    lessonTitleEn: lesson.title,
    chapterNumber: unitN,
    chapterTitleAr: lesson.chapter?.titleAr ?? '',
    periodNumber: 1,
    teacherGuidePages: lesson.pageStartTe && lesson.pageEndTe ? `${lesson.pageStartTe}-${lesson.pageEndTe}` : undefined,
    studentBookPages: lesson.pageStartSe && lesson.pageEndSe ? `${lesson.pageStartSe}-${lesson.pageEndSe}` : undefined,
    learningOutcomes: (lesson.learningOutcomes ?? []).map((lo) => ({
      descriptionAr: lo.descriptionAr, bloomLevel: lo.bloomLevel,
    })),
    misconceptions: misc.map((m) => ({ nameAr: m.nameAr, descriptionAr: null, remediationHintAr: null })),
    guidePhilosophy: DROP_GUIDE_PHILOSOPHY ? undefined : toText(guide),
    unitOverview: DROP_UNIT_OVERVIEW ? undefined : toText(unit),
    lessonSourceTe: toText(te),
    lessonSourceSe: toText(se),
    semesterPlan: DROP_SEMESTER_PLAN ? undefined : plan,
  };

  const prompt = buildSystemPrompt(ctx);
  console.log(`prompt: ${prompt.length} chars (~${Math.round(prompt.length / 3.5)} tokens estimated)`);

  const tGen = Date.now();
  console.log(`[${new Date().toISOString()}] calling Ollama...`);
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 600_000);
  const heartbeat = setInterval(() => {
    const sec = ((Date.now() - tGen) / 1000).toFixed(0);
    console.log(`[${new Date().toISOString()}] still waiting... ${sec}s elapsed`);
  }, 30_000);
  try {
    const result = await generateLessonPlan({
      schema: lessonPlanSchema,
      systemPrompt: prompt,
      userPrompt:
        `ولّد خطة الحصة ${ctx.periodNumber} لدرس ${ctx.lessonTitleAr}.\n\n` +
        `## قواعد صارمة:\n` +
        `1. **teacher_guide_page** يجب أن يكون رقم صفحة فعلي في دليل المعلم ضمن المدى [${lesson.pageStartTe}-${lesson.pageEndTe}] — لا تستخدم أرقاماً صغيرة مثل 5 أو 6. أمثلة صالحة: ${lesson.pageStartTe}, ${lesson.pageStartTe! + 2}, ${lesson.pageEndTe}.\n` +
        `2. **qncf_code** لهذه الوحدة (الإحصاء) يستخدم رمز "STA" (3 أحرف بالضبط). مثال: QNCF-G11-M-STA-001. ممنوع "DATA" أو أي رمز آخر.`,
      temperature: 0.3,
      abortSignal: abort.signal,
    });
    clearInterval(heartbeat);
    clearTimeout(timeout);
    const ms = Date.now() - tGen;
    console.log(`[${new Date().toISOString()}] ✅ generation done in ${(ms / 1000).toFixed(1)}s`);
    if (result.rawText !== undefined) {
      console.log(`rawText: ${result.rawText.length} chars`);
    }
    console.log(`output keys: ${Object.keys(result.object as object).join(', ')}`);
    console.log(`title: ${(result.object as { lesson_title_ar?: string }).lesson_title_ar}`);

    // triple-gate
    const tg = validateTripleGate(result.object);
    const trace = validateSourceTraceability(result.object as Parameters<typeof validateSourceTraceability>[0], {
      pageStartTe: lesson.pageStartTe, pageEndTe: lesson.pageEndTe,
    });
    console.log(`triple-gate: ${tg.passed ? 'PASS' : 'FAIL'} bloom=${tg.results.bloom_gate} qncf=${tg.results.qncf_gate} advisor=${tg.results.advisor_gate}`);
    if (!tg.passed) console.log('triple-gate reasons:', tg.failure_reasons);
    console.log(`trace: ${trace.passed ? 'PASS' : 'FAIL'}`);
    if (!trace.passed) console.log('trace reasons:', trace.reasons);
  } catch (e) {
    clearInterval(heartbeat);
    clearTimeout(timeout);
    const ms = Date.now() - tGen;
    console.log(`[${new Date().toISOString()}] ❌ FAILED after ${(ms / 1000).toFixed(1)}s`);
    console.log('error:', (e as Error).message);
    if ((e as { cause?: unknown }).cause) console.log('cause:', (e as { cause?: unknown }).cause);
    if ((e as Error).stack) console.log('stack:', (e as Error).stack);
  }
  console.log(`total wall: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
