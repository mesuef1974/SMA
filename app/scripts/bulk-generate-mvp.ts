/**
 * Bulk lesson-plan generation — MVP wave.
 *
 * Mirrors the business logic of POST /api/lesson-plans/generate
 * (route.ts lines ~100-260), skipping auth/CSRF/rate-limit.
 *
 * For each of 14 lessons (default: excludes 5-1 which already has a template)
 *   × 2 periods → 28 total generations, sequential.
 *
 * Reports per-iteration progress + final table + cost/time summary.
 *
 * Usage:
 *   cd D:/SMA/app && npx tsx scripts/bulk-generate-mvp.ts
 *   cd D:/SMA/app && npx tsx scripts/bulk-generate-mvp.ts --include-5-1
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { sql } from 'drizzle-orm';
import { generateObject } from 'ai';

// --- Pricing (Anthropic Claude Sonnet 4.x, USD per 1M tokens) ---
const PRICE_INPUT_PER_M = 3.0;
const PRICE_CACHED_INPUT_PER_M = 0.3;
const PRICE_CACHE_CREATION_PER_M = 3.75; // 5-min ephemeral write
const PRICE_OUTPUT_PER_M = 15.0;

// --- Safety knobs ---
const PER_GEN_TIMEOUT_MS = 180_000;
const MAX_CONSECUTIVE_ERRORS = 3;

interface Row {
  lesson: string;
  period: 1 | 2;
  gate: string;
  trace: string;
  status: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  timeMs: number;
  error?: string;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${ms}ms: ${label}`)), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const includeFiveOne = args.includes('--include-5-1');

  // --- Dynamic imports (after dotenv) ---
  const { db } = await import('../src/db');
  const { getLessonById, getMisconceptionStats, createLessonPlan } = await import(
    '../src/db/queries'
  );
  const {
    getGuidePhilosophy,
    getUnitIntro,
    getLessonContent,
  } = await import('../src/db/queries/curriculum-sources');
  const { getSemesterPlan } = await import('../src/db/queries/semester-plan');
  const { isAIConfigured, getAIModel } = await import('../src/lib/ai/provider');
  const { buildSystemPrompt } = await import('../src/lib/lesson-plans/prompt');
  const { isFullEnrichmentLesson } = await import('../src/lib/lesson-plans/enrichment');
  const { lessonPlanSchema } = await import('../src/lib/lesson-plans/schema');
  const { filterToLatinNumerals } = await import('../src/lib/lesson-plans/numeral-filter');
  const { validateTripleGate, validateSourceTraceability } = await import(
    '../src/lib/lesson-plans/triple-gate'
  );
  type LessonContext = import('../src/lib/lesson-plans/prompt').LessonContext;
  type CurriculumSourceWithPages =
    import('../src/db/queries/curriculum-sources').CurriculumSourceWithPages;

  const sourceToText = (s: CurriculumSourceWithPages | null): string | undefined =>
    s?.pages.length
      ? s.pages
          .map((p) => `--- صفحة ${p.pageNumber} ---\n${p.contentAr ?? ''}`)
          .join('\n\n')
      : undefined;

  // --- Gate 0: AI configured? ---
  if (!isAIConfigured()) {
    console.error('❌ isAIConfigured() = false — ANTHROPIC_API_KEY missing or empty.');
    process.exit(1);
  }

  // --- Fetch lessons ---
  const allLessons = (await db.execute(
    sql`SELECT id, number FROM lessons ORDER BY number`,
  )) as Array<{ id: string; number: string }>;

  const lessons = includeFiveOne
    ? allLessons
    : allLessons.filter((l) => String(l.number) !== '5-1');

  console.log(
    `📚 Lessons: ${lessons.length} (includeFiveOne=${includeFiveOne}). ` +
      `Periods: 2. Total generations: ${lessons.length * 2}.`,
  );

  // --- Seed teacher ---
  const teacherRows = (await db.execute(
    sql`SELECT id FROM users WHERE role='teacher' LIMIT 1`,
  )) as Array<{ id: string }>;
  const teacherId = teacherRows[0]?.id;
  if (!teacherId) {
    console.error('❌ No teacher user found. Aborting.');
    process.exit(1);
  }
  console.log(`👤 Seed teacher: ${teacherId}\n`);

  // --- Prefetch shared guide + semester plan (same across all lessons) ---
  const guideSource = await getGuidePhilosophy();
  const semesterPlan = await getSemesterPlan();

  const rows: Row[] = [];
  let consecutiveErrors = 0;
  const totalStart = Date.now();
  const total = lessons.length * 2;
  let idx = 0;

  for (const l of lessons) {
    // Skip full-enrichment lessons per the official semester plan.
    if (isFullEnrichmentLesson(l.number)) {
      console.log(
        `SKIP ${l.number}: enrichment lesson per official semester plan`,
      );
      idx += 2;
      continue;
    }

    const lesson = await getLessonById(l.id);
    if (!lesson) {
      for (const period of [1, 2] as const) {
        idx++;
        rows.push({
          lesson: l.number,
          period,
          gate: 'ERR',
          trace: 'ERR',
          status: 'lesson_not_found',
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
          timeMs: 0,
          error: 'lesson_not_found',
        });
      }
      continue;
    }

    const unitNumber = lesson.chapter?.number ?? 0;
    const lessonNumSuffix = Number.parseInt(
      String(lesson.number).split('-').pop() ?? '',
      10,
    );
    // Per-lesson sources (shared between P1 and P2 to save DB round-trips)
    const [unitSource, teLessonSource, seLessonSource] = await Promise.all([
      unitNumber > 0 ? getUnitIntro(unitNumber, 'TE') : Promise.resolve(null),
      unitNumber > 0 && Number.isFinite(lessonNumSuffix)
        ? getLessonContent(unitNumber, lessonNumSuffix, 'TE')
        : Promise.resolve(null),
      unitNumber > 0 && Number.isFinite(lessonNumSuffix)
        ? getLessonContent(unitNumber, lessonNumSuffix, 'SE')
        : Promise.resolve(null),
    ]);
    const misconceptionData = await getMisconceptionStats(l.id);

    for (const period of [1, 2] as const) {
      idx++;
      const genStart = Date.now();
      const prefix = `[${idx}/${total}] ${l.number} P${period}:`;

      try {
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
          chapterNumber: unitNumber,
          chapterTitleAr: lesson.chapter?.titleAr ?? '',
          periodNumber: period,
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

        const systemPrompt = buildSystemPrompt(context);

        const result = await withTimeout(
          generateObject({
            model: getAIModel(),
            schema: lessonPlanSchema,
            system: [
              {
                role: 'system' as const,
                content: systemPrompt,
                providerOptions: {
                  anthropic: { cacheControl: { type: 'ephemeral' } },
                },
              },
            ],
            prompt: `أنشئ تحضير الحصة ${period} لدرس "${lesson.titleAr}" من الفصل ${unitNumber} (${lesson.chapter?.titleAr ?? ''}). التزم بالتوقيتات المحددة والمخرجات التعليمية.`,
            maxOutputTokens: 8000,
          }),
          PER_GEN_TIMEOUT_MS,
          `${l.number} P${period}`,
        );

        // Latin-numeral filter
        let sectionData = result.object;
        sectionData = filterToLatinNumerals(sectionData) as typeof sectionData;

        // Usage & cost
        const usage = result.usage as {
          inputTokens?: number;
          outputTokens?: number;
          cachedInputTokens?: number;
          cacheCreationInputTokens?: number;
        };
        const inTok = usage?.inputTokens ?? 0;
        const outTok = usage?.outputTokens ?? 0;
        const cachedTok = usage?.cachedInputTokens ?? 0;
        const cacheWriteTok = usage?.cacheCreationInputTokens ?? 0;
        const freshInTok = Math.max(0, inTok - cachedTok - cacheWriteTok);
        const cost =
          (freshInTok * PRICE_INPUT_PER_M) / 1_000_000 +
          (cachedTok * PRICE_CACHED_INPUT_PER_M) / 1_000_000 +
          (cacheWriteTok * PRICE_CACHE_CREATION_PER_M) / 1_000_000 +
          (outTok * PRICE_OUTPUT_PER_M) / 1_000_000;

        // Unit mismatch?
        const expectedUnit = unitNumber;
        const unitMatch = sectionData.header.unit_number === expectedUnit;

        if (!unitMatch) {
          const plan = await createLessonPlan({
            lessonId: l.id,
            teacherId,
            periodNumber: period,
            status: 'rejected_gate',
            sectionData,
            aiSuggestions: {
              model: 'claude-sonnet-4-6',
              generatedAt: new Date().toISOString(),
              usage: result.usage,
              gate_status: 'unit_mismatch',
              gate_failures: [
                `unit_mismatch: expected ${expectedUnit}, got ${sectionData.header.unit_number}`,
              ],
            },
          });
          const timeMs = Date.now() - genStart;
          rows.push({
            lesson: l.number,
            period,
            gate: 'SKIP',
            trace: 'SKIP',
            status: 'unit_mismatch',
            tokensIn: inTok,
            tokensOut: outTok,
            costUsd: cost,
            timeMs,
          });
          console.log(
            `${prefix} unit_mismatch (expected ${expectedUnit}, got ${sectionData.header.unit_number}) ` +
              `tokens=${inTok}in/${outTok}out cost~$${cost.toFixed(4)} t=${timeMs}ms id=${plan?.id}`,
          );
          consecutiveErrors = 0;
          continue;
        }

        // Triple-gate + traceability
        const gateResult = validateTripleGate(sectionData);
        const traceResult = validateSourceTraceability(sectionData, {
          pageStartTe: lesson.pageStartTe,
          pageEndTe: lesson.pageEndTe,
        });
        if (!traceResult.passed) {
          gateResult.failure_reasons.push(...traceResult.reasons);
          gateResult.results.failure_reasons.push(...traceResult.reasons);
        }

        const gatePass = gateResult.passed;
        const tracePass = traceResult.passed;
        const overallPass = gatePass && tracePass;

        let savedStatus: 'draft' | 'rejected_gate';
        if (!overallPass) {
          savedStatus = 'rejected_gate';
          const plan = await createLessonPlan({
            lessonId: l.id,
            teacherId,
            periodNumber: period,
            status: 'rejected_gate',
            sectionData: { ...sectionData, gate_results: gateResult.results },
            aiSuggestions: {
              model: 'claude-sonnet-4-6',
              generatedAt: new Date().toISOString(),
              usage: result.usage,
              gate_status: 'rejected_gate',
              gate_failures: gateResult.failure_reasons,
            },
          });
          const timeMs = Date.now() - genStart;
          rows.push({
            lesson: l.number,
            period,
            gate: gatePass ? 'PASS' : `FAIL(${gateResult.failure_reasons.length})`,
            trace: tracePass ? 'PASS' : `FAIL(${traceResult.reasons.length})`,
            status: savedStatus,
            tokensIn: inTok,
            tokensOut: outTok,
            costUsd: cost,
            timeMs,
          });
          console.log(
            `${prefix} gate=${gatePass ? 'PASS' : `FAIL(${gateResult.failure_reasons.length})`} ` +
              `trace=${tracePass ? 'PASS' : `FAIL(${traceResult.reasons.length})`} ` +
              `status=${savedStatus} tokens=${inTok}in/${outTok}out cost~$${cost.toFixed(4)} ` +
              `t=${timeMs}ms id=${plan?.id}`,
          );
        } else {
          sectionData.gate_results = gateResult.results;
          savedStatus = 'draft';
          const plan = await createLessonPlan({
            lessonId: l.id,
            teacherId,
            periodNumber: period,
            status: 'draft',
            sectionData,
            aiSuggestions: {
              model: 'claude-sonnet-4-6',
              generatedAt: new Date().toISOString(),
              usage: result.usage,
            },
          });
          const timeMs = Date.now() - genStart;
          rows.push({
            lesson: l.number,
            period,
            gate: 'PASS',
            trace: 'PASS',
            status: 'draft',
            tokensIn: inTok,
            tokensOut: outTok,
            costUsd: cost,
            timeMs,
          });
          console.log(
            `${prefix} gate=PASS trace=PASS status=draft ` +
              `tokens=${inTok}in/${outTok}out cost~$${cost.toFixed(4)} ` +
              `t=${timeMs}ms id=${plan?.id}`,
          );
        }
        consecutiveErrors = 0;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const timeMs = Date.now() - genStart;
        rows.push({
          lesson: l.number,
          period,
          gate: 'ERR',
          trace: 'ERR',
          status: 'error',
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
          timeMs,
          error: msg,
        });
        console.error(`${prefix} ❌ ERROR: ${msg} (t=${timeMs}ms)`);
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(
            `\n🛑 ${MAX_CONSECUTIVE_ERRORS} consecutive errors — aborting to preserve API budget.`,
          );
          break;
        }
      }
    }
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) break;
  }

  const totalMs = Date.now() - totalStart;

  // --- Final table ---
  console.log('\n================= RESULTS =================');
  console.table(
    rows.map((r) => ({
      lesson: r.lesson,
      period: r.period,
      gate: r.gate,
      trace: r.trace,
      status: r.status,
      inTok: r.tokensIn,
      outTok: r.tokensOut,
      cost$: r.costUsd.toFixed(4),
      ms: r.timeMs,
    })),
  );

  // --- Summary ---
  const draftCount = rows.filter((r) => r.status === 'draft').length;
  const gateRejected = rows.filter((r) => r.status === 'rejected_gate').length;
  const unitMismatch = rows.filter((r) => r.status === 'unit_mismatch').length;
  const errorCount = rows.filter((r) => r.status === 'error' || r.status === 'lesson_not_found').length;
  const totalCost = rows.reduce((s, r) => s + r.costUsd, 0);
  const totalIn = rows.reduce((s, r) => s + r.tokensIn, 0);
  const totalOut = rows.reduce((s, r) => s + r.tokensOut, 0);
  const avgMs =
    rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.timeMs, 0) / rows.length) : 0;

  console.log('\n================= SUMMARY =================');
  console.log(`Total attempts      : ${rows.length}`);
  console.log(`✅ draft (full PASS): ${draftCount}`);
  console.log(`⚠️  rejected_gate   : ${gateRejected}`);
  console.log(`⚠️  unit_mismatch   : ${unitMismatch}`);
  console.log(`❌ errors           : ${errorCount}`);
  console.log(`Tokens in / out     : ${totalIn.toLocaleString()} / ${totalOut.toLocaleString()}`);
  console.log(`Total cost (USD)    : $${totalCost.toFixed(4)}`);
  console.log(`Total time          : ${(totalMs / 1000).toFixed(1)}s`);
  console.log(`Avg per generation  : ${(avgMs / 1000).toFixed(1)}s`);

  // --- Failure pattern breakdown (top reasons) ---
  const errors = rows.filter((r) => r.error).map((r) => `${r.lesson}-P${r.period}: ${r.error}`);
  if (errors.length) {
    console.log('\nError samples (first 5):');
    errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
  }

  process.exit(0);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
