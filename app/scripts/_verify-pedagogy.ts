/**
 * Verify unit-5 plans against advisor pedagogy map.
 * Prints focus_ar (advisor expectation) vs. generated content for each period.
 */
delete process.env.ANTHROPIC_BASE_URL;
delete process.env.ANTHROPIC_AUTH_TOKEN;
delete process.env.ANTHROPIC_API_KEY;
import { config } from 'dotenv';
config({ path: '.env.local', override: true });
import { sql } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const { db } = await import('../src/db');
  const ped = JSON.parse(
    readFileSync(resolve(process.cwd(), 'docs/unit-5-period-pedagogy-map.json'), 'utf8'),
  ) as { period_pedagogy_map: Record<string, { total_periods: number; periods: Array<{ period: number; focus_ar?: string; summative_weight?: number }> }> };

  const rows = (await db.execute(sql`
    SELECT l.number AS lesson, lp.period_number, lp.status,
           lp.section_data AS data
    FROM lesson_plans lp
    JOIN lessons l ON l.id=lp.lesson_id
    JOIN chapters c ON c.id=l.chapter_id
    WHERE c.number='5'
    ORDER BY l.number, lp.period_number
  `)) as Array<{ lesson: string; period_number: number; status: string; data: Record<string, unknown> & { warm_up?: { activity_ar?: string }; explore?: { activity_ar?: string }; assess?: { items?: unknown[] }; practice?: { items?: unknown[] } } }>;

  console.log(`\nTotal plans in DB: ${rows.length}\n`);

  const targets = new Set(['5-2 P3', '5-3 P3', '5-3 P4', '5-4 P3']);
  for (const r of rows) {
    const entry = ped.period_pedagogy_map[r.lesson]?.periods.find(
      (p) => p.period === r.period_number,
    );
    const tag = `${r.lesson} P${r.period_number}`;
    const mark = targets.has(tag) ? '🆕' : '  ';
    const advisorFocus = entry?.focus_ar ?? '(missing in map)';
    const warm = r.data?.warm_up?.activity_ar ?? '';
    const explore = r.data?.explore?.activity_ar ?? '';
    const assessCount = r.data?.assess?.items?.length ?? 0;
    const practiceCount = r.data?.practice?.items?.length ?? 0;
    console.log(`${mark} ${tag}  [${r.status}]`);
    console.log(`    advisor focus_ar : ${advisorFocus}`);
    console.log(`    generated warm   : ${warm.slice(0, 110)}`);
    console.log(`    generated explore: ${explore.slice(0, 110)}`);
    console.log(`    practice=${practiceCount} items, assess=${assessCount} items, summative_weight=${entry?.summative_weight ?? '?'}\n`);
  }
  process.exit(0);
}
main();
