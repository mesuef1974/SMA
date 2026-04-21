/**
 * Build the 5-1 period-1 system prompt and print its size.
 * No AI call. No DB writes. Mirrors smoke-ollama-5-1.ts context assembly.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  const { getLessonById, getMisconceptionStats } = await import('../src/db/queries');
  const {
    getGuidePhilosophy, getUnitIntro, getLessonContent,
  } = await import('../src/db/queries/curriculum-sources');
  const { getSemesterPlan } = await import('../src/db/queries/semester-plan');
  const { buildSystemPrompt } = await import('../src/lib/lesson-plans/prompt');
  type CurriculumSourceWithPages =
    import('../src/db/queries/curriculum-sources').CurriculumSourceWithPages;
  type LessonContext = import('../src/lib/lesson-plans/prompt').LessonContext;

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
    guidePhilosophy: undefined, // DROP — test post-trim size
    unitOverview: toText(unit),
    lessonSourceTe: toText(te),
    lessonSourceSe: toText(se),
    semesterPlan: plan,
  };

  const prompt = buildSystemPrompt(ctx);
  console.log(`prompt length: ${prompt.length} chars (~${Math.round(prompt.length / 3.5)} tokens estimated, ~KB=${(prompt.length / 1024).toFixed(1)})`);

  // Per-field breakdown of what we injected
  const layerSize = (s?: string) => s?.length ?? 0;
  console.log(`  ctx.guidePhilosophy: ${layerSize(ctx.guidePhilosophy)}`);
  console.log(`  ctx.unitOverview:    ${layerSize(ctx.unitOverview)}`);
  console.log(`  ctx.lessonSourceTe:  ${layerSize(ctx.lessonSourceTe)}`);
  console.log(`  ctx.lessonSourceSe:  ${layerSize(ctx.lessonSourceSe)}`);
  console.log(`  ctx.semesterPlan:    ${layerSize(ctx.semesterPlan)}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
