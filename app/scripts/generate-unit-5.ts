/**
 * Generate all 8 lesson plans for unit 5 (lessons 5-1..5-4, periods 1 & 2).
 * Provider-agnostic — respects AI_PROVIDER env var (anthropic/gemini/ollama).
 * Persists to DB with status='draft', advisor_gate='pending'.
 *
 * Skips lesson plans that already exist (lessonId + periodNumber unique).
 *
 * 6-layer source injection (full pedagogical depth):
 *   1. guidePhilosophy — teacher guide philosophy (early pages)
 *   2. unitOverview    — unit 5 intro / overview
 *   3. lessonSourceTe  — teacher guide pages for this lesson
 *   4. lessonSourceSe  — student book pages for this lesson
 *   5. semesterPlan    — official Ministry of Education semester plan
 *   6. periodPedagogy  — per-(lesson, period) advisor pedagogy map entry
 *                        (docs/unit-5-period-pedagogy-map.json)
 *
 * Previously (Ollama local, 8GB VRAM) we dropped layers 1/2/5 to fit ctx
 * window. With Anthropic (200K ctx) all 6 layers are injected.
 */
import { config } from 'dotenv';
// Claude Code harness injects ANTHROPIC_BASE_URL without /v1 and ANTHROPIC_AUTH_TOKEN
// into subprocess env, which hijacks @ai-sdk/anthropic. Purge before loading .env.local.
delete process.env.ANTHROPIC_BASE_URL;
delete process.env.ANTHROPIC_AUTH_TOKEN;
delete process.env.ANTHROPIC_API_KEY;
config({ path: '.env.local', override: true });
import { sql } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load advisor pedagogy map once at startup. Source of truth for period split.
type PedagogyEntry = {
  period: number;
  focus_ar: string;
  five_e_stage: string;
  bloom_levels: string[];
  learning_outcomes_focus: string[];
  primary_interaction_types: string[];
  summative_weight: number;
};
type PedagogyMap = {
  period_pedagogy_map: Record<string, {
    total_periods: number;
    title_ar: string;
    periods: PedagogyEntry[];
  }>;
};
const pedagogyMapPath = resolve(process.cwd(), 'docs/unit-5-period-pedagogy-map.json');
const pedagogyMap = JSON.parse(readFileSync(pedagogyMapPath, 'utf8')) as PedagogyMap;
console.log(`pedagogy map loaded: ${Object.keys(pedagogyMap.period_pedagogy_map).join(', ')}`);

const TEACHER_ID = '10089cca-dab0-4416-898c-ff99ae68d397';

async function main() {
  const { db } = await import('../src/db');
  const { getLessonById, getMisconceptionStats, createLessonPlan } = await import('../src/db/queries');
  const {
    getGuidePhilosophy, getUnitIntro, getLessonContent,
  } = await import('../src/db/queries/curriculum-sources');
  const { getSemesterPlan } = await import('../src/db/queries/semester-plan');
  const { buildSystemPrompt } = await import('../src/lib/lesson-plans/prompt');
  const { lessonPlanSchema } = await import('../src/lib/lesson-plans/schema');
  const { filterToLatinNumerals } = await import('../src/lib/lesson-plans/numeral-filter');
  const { validateTripleGate, validateSourceTraceability } = await import(
    '../src/lib/lesson-plans/triple-gate'
  );
  const { generateLessonPlan } = await import('../src/lib/ai/generate-lesson-plan');
  const { PROVIDER, ANTHROPIC_MODEL, GEMINI_MODEL, OLLAMA_MODEL } = await import('../src/lib/ai/provider');
  type CurriculumSourceWithPages =
    import('../src/db/queries/curriculum-sources').CurriculumSourceWithPages;
  type LessonContext = import('../src/lib/lesson-plans/prompt').LessonContext;

  const MODEL_NAME =
    PROVIDER === 'anthropic' ? ANTHROPIC_MODEL
    : PROVIDER === 'gemini' ? GEMINI_MODEL
    : OLLAMA_MODEL;

  console.log(`provider=${PROVIDER} model=${MODEL_NAME} teacher=${TEACHER_ID}`);

  const lessons = (await db.execute(
    sql`SELECT l.id, l.number FROM lessons l JOIN chapters c ON l.chapter_id = c.id
        WHERE c.number = 5 AND l.number IN ('5-1','5-2','5-3','5-4') ORDER BY l.number`,
  )) as Array<{ id: string; number: string }>;
  console.log(`lessons found: ${lessons.map(l => l.number).join(', ')}`);

  type Result = { lesson: string; period: number; status: string; ms: number; notes?: string };
  const results: Result[] = [];

  // Periods to generate per lesson — derived from the advisor pedagogy map
  // (total_periods per lesson). Script skips plans already in DB, so this is
  // the *target* set. Per MOE Q2 plan: 5-1=3, 5-2=3, 5-3=4, 5-4=3 (13 total).
  const PERIODS_PER_LESSON: Record<string, readonly number[]> = Object.fromEntries(
    Object.entries(pedagogyMap.period_pedagogy_map).map(([lessonNum, v]) => [
      lessonNum,
      Array.from({ length: v.total_periods }, (_, i) => i + 1),
    ]),
  );
  console.log('periods per lesson:', PERIODS_PER_LESSON);

  // Preload unit-level sources once (guide philosophy + unit 5 overview + semester plan).
  // These are shared across all 8 plans — no reason to fetch per-iteration.
  const unitN = 5;
  const [guide, unit, semesterPlan] = await Promise.all([
    getGuidePhilosophy(),
    getUnitIntro(unitN, 'TE'),
    getSemesterPlan(),
  ]);
  const toText = (s: CurriculumSourceWithPages | null) =>
    s?.pages.length
      ? s.pages.map((p) => `--- صفحة ${p.pageNumber} ---\n${p.contentAr ?? ''}`).join('\n\n')
      : undefined;
  // Source truncation — keeps prompt ≤80K chars to stay under Tier-1 TPM (30K tokens/min).
  // Full untrimmed prompt hits ~160K → 429 rate-limit on Anthropic Tier 1.
  // Budget (chars): guide≤5K, unit_overview≤4K, each lesson source≤15K.
  // The critical per-period focus comes from the 6th layer (periodPedagogy),
  // not from repeating the whole guide in every prompt.
  const truncate = (s: string | undefined, max: number, label: string): string | undefined => {
    if (!s) return s;
    if (s.length <= max) return s;
    return s.slice(0, max) + `\n\n[... اقتُطع ${label} عند ${max} حرفاً للبقاء ضمن سقف TPM ...]`;
  };
  const fullGuide = toText(guide);
  const guidePhilosophyText = truncate(fullGuide, 5_000, 'فلسفة الدليل');
  const unitOverviewText = truncate(toText(unit), 4_000, 'مقدمة الوحدة');
  console.log(
    `sources loaded: guide=${guidePhilosophyText?.length ?? 0} (raw ${fullGuide?.length ?? 0}) chars, ` +
    `unit_overview=${unitOverviewText?.length ?? 0} chars, ` +
    `semester_plan=${semesterPlan?.length ?? 0} chars`,
  );

  for (const lrow of lessons) {
    const lesson = await getLessonById(lrow.id);
    if (!lesson) { console.log(`skip ${lrow.number}: not found`); continue; }
    const lessonNumSuffix = Number.parseInt(String(lesson.number).split('-').pop() ?? '', 10);
    const misc = await getMisconceptionStats(lrow.id);

    const [te, se] = await Promise.all([
      getLessonContent(unitN, lessonNumSuffix, 'TE'),
      getLessonContent(unitN, lessonNumSuffix, 'SE'),
    ]);

    const periods = PERIODS_PER_LESSON[lrow.number] ?? [];
    for (const periodNumber of periods) {
      const exists = (await db.execute(
        sql`SELECT id FROM lesson_plans WHERE lesson_id = ${lrow.id} AND period_number = ${periodNumber} LIMIT 1`,
      )) as Array<{ id: string }>;
      if (exists.length > 0) {
        console.log(`⏭  skip ${lrow.number} P${periodNumber}: already exists`);
        results.push({ lesson: lrow.number, period: periodNumber, status: 'skipped', ms: 0 });
        continue;
      }

      // 6th layer — per-period advisor pedagogy guidance for THIS (lesson, period).
      const pedLesson = pedagogyMap.period_pedagogy_map[lrow.number];
      const pedEntry = pedLesson?.periods.find((p) => p.period === periodNumber);
      if (!pedEntry) {
        console.log(`⚠️  ${lrow.number} P${periodNumber}: no pedagogy map entry — skipping`);
        results.push({ lesson: lrow.number, period: periodNumber, status: 'no_pedagogy', ms: 0 });
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
        // 6-layer injection — full depth, ordered generic → specific.
        guidePhilosophy: guidePhilosophyText,
        unitOverview: unitOverviewText,
        lessonSourceTe: truncate(toText(te), 15_000, `محتوى الدرس TE ${lrow.number}`),
        lessonSourceSe: truncate(toText(se), 15_000, `محتوى الدرس SE ${lrow.number}`),
        semesterPlan: semesterPlan ?? undefined,
        periodPedagogy: {
          totalPeriods: pedLesson.total_periods,
          focusAr: pedEntry.focus_ar,
          fiveEStage: pedEntry.five_e_stage,
          bloomLevels: pedEntry.bloom_levels,
          learningOutcomesFocus: pedEntry.learning_outcomes_focus,
          primaryInteractionTypes: pedEntry.primary_interaction_types,
          summativeWeight: pedEntry.summative_weight,
        },
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
            model: MODEL_NAME,
            provider: PROVIDER,
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
        // TPM=30K cap on tier-1 Anthropic; each prompt ~50K tokens. Wait for
        // rolling window to clear before next request. Skip if Ollama/Gemini.
        if (PROVIDER === 'anthropic') {
          console.log(`  …TPM cooldown 130s before next request`);
          await new Promise((res) => setTimeout(res, 130_000));
        }
      } catch (e) {
        clearInterval(hb); clearTimeout(timeout);
        const ms = Date.now() - t0;
        const msg = (e as Error).message?.slice(0, 200) ?? 'unknown';
        console.log(`❌ ${tag} FAILED in ${(ms / 1000).toFixed(1)}s: ${msg}`);
        results.push({ lesson: lrow.number, period: periodNumber, status: 'error', ms, notes: msg });
        // If failure is rate-limit related, cool down longer before continuing.
        if (PROVIDER === 'anthropic' && /rate limit|429|exceed/i.test(msg)) {
          console.log(`  …rate-limit cooldown 150s before next request`);
          await new Promise((res) => setTimeout(res, 150_000));
        }
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
