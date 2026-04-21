/**
 * eval-pedagogy-alignment.ts
 *
 * Reads section_data (warm_up/explore = header+explain equivalents) for the
 * 5 newly-generated unit-5 plans and compares each plan's actual pedagogical
 * emphasis against the advisor pedagogy map.
 *
 * Prints a comparison table and a final verdict (matches / close / divergent).
 * Does NOT modify the database.
 */
delete process.env.ANTHROPIC_BASE_URL;
delete process.env.ANTHROPIC_AUTH_TOKEN;
delete process.env.ANTHROPIC_API_KEY;
import { config } from 'dotenv';
config({ path: '.env.local', override: true });
import { sql } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type MapEntry = {
  period: number;
  focus_ar: string;
  five_e_stage: string;
  summative_weight: number;
  primary_interaction_types: string[];
};

type Verdict = 'match' | 'close' | 'divergent';

// Targets requested in the task (the newly-generated plans + 5-3 P3 check).
const TARGETS: Array<{ lesson: string; period: number; id?: string }> = [
  { lesson: '5-1', period: 3, id: 'd6c15db8-8703-4f60-867e-2b9409edaacf' },
  { lesson: '5-2', period: 3 }, // latest draft for 5-2 P3
  { lesson: '5-3', period: 3 }, // was pre-existing — check if it matches map
  { lesson: '5-3', period: 4 },
  { lesson: '5-4', period: 3, id: '4c3951a0-2159-4748-81af-0f1738d461ca' },
];

function pickKeywords(focusAr: string): string[] {
  // Extract salient Arabic content-words (length > 2, no whitespace/punct)
  return focusAr
    .replace(/[+،.,()\[\]"']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .filter((w) => !['مع', 'من', 'على', 'في', 'إلى', 'بين', 'هذا', 'هذه'].includes(w));
}

function evaluateMatch(
  focusAr: string,
  summaryText: string,
  expectedWeight: number,
  actualAssessCount: number,
): Verdict {
  const keywords = pickKeywords(focusAr);
  if (keywords.length === 0) return 'close';
  const hits = keywords.filter((kw) => summaryText.includes(kw)).length;
  const ratio = hits / keywords.length;

  // Summative-weight sanity check: if advisor expects summative (>0.4),
  // plan should have >=3 assessment items.
  const weightOk = expectedWeight < 0.4 || actualAssessCount >= 3;

  if (ratio >= 0.4 && weightOk) return 'match';
  if (ratio >= 0.2 || weightOk) return 'close';
  return 'divergent';
}

function verdictIcon(v: Verdict): string {
  return v === 'match' ? '[MATCH]' : v === 'close' ? '[CLOSE]' : '[DIVERGENT]';
}

async function main() {
  const { db } = await import('../src/db');
  const ped = JSON.parse(
    readFileSync(resolve(process.cwd(), 'docs/unit-5-period-pedagogy-map.json'), 'utf8'),
  ) as { period_pedagogy_map: Record<string, { periods: MapEntry[] }> };

  const rows = (await db.execute(sql`
    SELECT lp.id,
           l.number AS lesson,
           lp.period_number,
           lp.status,
           lp.section_data AS data,
           lp.updated_at
    FROM lesson_plans lp
    JOIN lessons l ON l.id = lp.lesson_id
    JOIN chapters c ON c.id = l.chapter_id
    WHERE c.number = '5'
    ORDER BY l.number, lp.period_number, lp.updated_at DESC
  `)) as Array<{
    id: string;
    lesson: string;
    period_number: number;
    status: string;
    data: any;
    updated_at: Date;
  }>;

  console.log('\n=== Unit-5 Pedagogy Alignment Evaluation ===\n');
  console.log(`Total plans in DB: ${rows.length}`);
  console.log(`Targets under review: ${TARGETS.length}\n`);

  const results: Array<{
    tag: string;
    focus: string;
    summary: string;
    weight: number;
    verdict: Verdict;
  }> = [];

  for (const t of TARGETS) {
    // Pick the newest row matching this lesson+period (and id if provided).
    const candidates = rows.filter(
      (r) => r.lesson === t.lesson && r.period_number === t.period,
    );
    const row = t.id
      ? candidates.find((r) => r.id === t.id) ?? candidates[0]
      : candidates[0];

    const mapEntry = ped.period_pedagogy_map[t.lesson]?.periods.find(
      (p) => p.period === t.period,
    );
    const tag = `${t.lesson} P${t.period}`;

    if (!row) {
      console.log(`${tag} : NO PLAN FOUND IN DB`);
      continue;
    }
    if (!mapEntry) {
      console.log(`${tag} : NO MAP ENTRY`);
      continue;
    }

    const warm = row.data?.warm_up?.activity_ar ?? '';
    const explore = row.data?.explore?.activity_ar ?? '';
    const explain = row.data?.explain?.narrative_ar ?? row.data?.explain?.activity_ar ?? '';
    const summary = `${warm} ${explore} ${explain}`.slice(0, 600);

    const assessCount = row.data?.assess?.items?.length ?? 0;
    const verdict = evaluateMatch(
      mapEntry.focus_ar,
      `${warm} ${explore} ${explain}`,
      mapEntry.summative_weight,
      assessCount,
    );

    results.push({
      tag,
      focus: mapEntry.focus_ar,
      summary: summary.slice(0, 140),
      weight: mapEntry.summative_weight,
      verdict,
    });

    console.log(`${verdictIcon(verdict)} ${tag}  [${row.status}]  id=${row.id}`);
    console.log(`  map.focus_ar       : ${mapEntry.focus_ar}`);
    console.log(`  map.five_e_stage   : ${mapEntry.five_e_stage}`);
    console.log(`  map.summative_w    : ${mapEntry.summative_weight}`);
    console.log(`  plan.warm (head)   : ${warm.slice(0, 140)}`);
    console.log(`  plan.explore (head): ${explore.slice(0, 140)}`);
    console.log(`  plan.assess items  : ${assessCount}`);
    console.log('');
  }

  // Summary table
  console.log('\n=== Comparison Table ===');
  console.log('| lesson.period | map.focus_ar | plan summary (head) | summative_weight | verdict |');
  console.log('|---|---|---|---|---|');
  for (const r of results) {
    const shortSum = r.summary.replace(/\n/g, ' ').slice(0, 70);
    console.log(`| ${r.tag} | ${r.focus} | ${shortSum} | ${r.weight} | ${verdictIcon(r.verdict)} |`);
  }

  // Totals
  const matches = results.filter((r) => r.verdict === 'match').length;
  const close = results.filter((r) => r.verdict === 'close').length;
  const divergent = results.filter((r) => r.verdict === 'divergent').length;

  console.log('\n=== Totals ===');
  console.log(`MATCH     : ${matches}`);
  console.log(`CLOSE     : ${close}`);
  console.log(`DIVERGENT : ${divergent}`);
  console.log('');

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
