/**
 * check-interaction-types — count interaction_type distribution across
 * practice and assess items in all lesson_plans rows (latest per lesson+period).
 *
 * Usage: pnpm tsx scripts/check-interaction-types.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

type Item = { interaction_type?: string; question_ar?: string };
type Row = {
  number: string;
  period_number: number;
  pitems: Item[] | null;
  aitems: Item[] | null;
};

// Mirror of the UI's parseDataFromQuestion + inferInteractionType (P1.5).
function hasNumericData(q: string | undefined): boolean {
  if (!q) return false;
  const normalized = q.replace(/،/g, ',');
  const match = normalized.match(
    /(-?\d+(?:\.\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?){2,})/,
  );
  if (!match) return false;
  const nums = match[1]
    .split(',')
    .map((s) => Number.parseFloat(s.trim()))
    .filter((n) => Number.isFinite(n));
  return nums.length >= 3;
}
function inferKind(q: string | undefined): string {
  const text = q ?? '';
  const hasData = hasNumericData(text);
  const hasDrawVerb = /(ارسم|مثّل|مثل|اصنع|ارسمي)/.test(text);
  if (hasDrawVerb && hasData) return 'guided_drawing';
  if (hasData) return 'data_reveal';
  if (/(فسّر|فسر|ناقش|قارن|اشرح|وضّح|وضح|برهن|علّل|علل|لماذا|متى نستخدم)/.test(text)) {
    return 'think_pair_share';
  }
  return 'try_reveal';
}

(async () => {
  const { db } = await import('../src/db');
  const rows = (await db.execute(sql`
    SELECT DISTINCT ON (l.id, lp.period_number)
      l.number,
      lp.period_number,
      lp.section_data->'practice'->'items' AS pitems,
      lp.section_data->'assess'->'items'   AS aitems
    FROM lesson_plans lp
    JOIN lessons l ON l.id = lp.lesson_id
    ORDER BY l.id, lp.period_number, lp.updated_at DESC
  `)) as unknown as Row[];

  const counts = { practice: new Map<string, number>(), assess: new Map<string, number>() };
  let totalP = 0;
  let totalA = 0;

  for (const r of rows) {
    for (const it of r.pitems ?? []) {
      const k = it.interaction_type ?? '(unset)';
      counts.practice.set(k, (counts.practice.get(k) ?? 0) + 1);
      totalP++;
    }
    for (const it of r.aitems ?? []) {
      const k = it.interaction_type ?? '(unset)';
      counts.assess.set(k, (counts.assess.get(k) ?? 0) + 1);
      totalA++;
    }
  }

  function pct(n: number, total: number) {
    return total === 0 ? '0%' : `${((n / total) * 100).toFixed(1)}%`;
  }

  console.log(`\n=== lesson plans scanned: ${rows.length} (latest per lesson+period) ===`);

  console.log(`\npractice items (total=${totalP}):`);
  for (const [k, v] of [...counts.practice.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${String(v).padStart(4)}  ${pct(v, totalP)}`);
  }

  console.log(`\nassess items (total=${totalA}):`);
  for (const [k, v] of [...counts.assess.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${String(v).padStart(4)}  ${pct(v, totalA)}`);
  }

  // BEFORE-fix render: UI used `?? 'try_reveal'` blindly. AssessSlide only
  // branched on think_pair_share; everything else became try_reveal.
  const beforePractice = new Map<string, number>();
  const beforeAssess = new Map<string, number>();
  for (const r of rows) {
    for (const it of r.pitems ?? []) {
      const k = it.interaction_type;
      const rendered =
        k === 'data_reveal' || k === 'guided_drawing' || k === 'think_pair_share'
          ? k
          : 'try_reveal';
      beforePractice.set(rendered, (beforePractice.get(rendered) ?? 0) + 1);
    }
    for (const it of r.aitems ?? []) {
      const k = it.interaction_type;
      const rendered = k === 'think_pair_share' ? k : 'try_reveal';
      beforeAssess.set(rendered, (beforeAssess.get(rendered) ?? 0) + 1);
    }
  }

  // AFTER-fix render: honor generator value; if missing, infer from shape.
  const afterPractice = new Map<string, number>();
  const afterAssess = new Map<string, number>();
  for (const r of rows) {
    for (const it of r.pitems ?? []) {
      const k = it.interaction_type ?? inferKind(it.question_ar);
      afterPractice.set(k, (afterPractice.get(k) ?? 0) + 1);
    }
    for (const it of r.aitems ?? []) {
      const k = it.interaction_type ?? inferKind(it.question_ar);
      afterAssess.set(k, (afterAssess.get(k) ?? 0) + 1);
    }
  }

  console.log(`\nBEFORE fix — practice render:`);
  for (const [k, v] of beforePractice) {
    console.log(`  ${k.padEnd(20)} ${String(v).padStart(4)}  ${pct(v, totalP)}`);
  }
  console.log(`\nBEFORE fix — assess render:`);
  for (const [k, v] of beforeAssess) {
    console.log(`  ${k.padEnd(20)} ${String(v).padStart(4)}  ${pct(v, totalA)}`);
  }

  console.log(`\nAFTER fix — practice render (existing rows, heuristic inference):`);
  for (const [k, v] of [...afterPractice.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${String(v).padStart(4)}  ${pct(v, totalP)}`);
  }
  console.log(`\nAFTER fix — assess render (existing rows, heuristic inference):`);
  for (const [k, v] of [...afterAssess.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${String(v).padStart(4)}  ${pct(v, totalA)}`);
  }

  process.exit(0);
})();
