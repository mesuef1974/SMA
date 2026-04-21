import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');

  // 1) list all plans for unit 5
  const rows = (await db.execute(sql`
    SELECT l.number AS lesson_code, lp.period_number, lp.status, lp.created_at,
           lp.id AS plan_id, lp.section_data
    FROM lesson_plans lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN chapters c ON l.chapter_id = c.id
    WHERE c.number = 5
    ORDER BY l.number, lp.period_number
  `)) as Array<{ lesson_code: string; period_number: number; status: string; created_at: Date; plan_id: string; section_data: any }>;

  console.log(`\n========== Unit 5 plans (${rows.length} total) ==========`);
  for (const r of rows) {
    console.log(`  ${r.lesson_code} P${r.period_number}  status=${r.status}  created=${new Date(r.created_at).toISOString()}  id=${r.plan_id}`);
  }

  // 2) deep check on 5-3 P1
  const five3 = rows.filter(r => r.lesson_code === '5-3');
  console.log(`\n========== Quality check: 5-3 ==========`);
  for (const r of five3) {
    const sd = r.section_data;
    const formulas = sd?.formulas ?? [];
    const blob = JSON.stringify(sd);
    const guideKeywords = ['دليل المعلم', 'الفلسفة', 'المنهج التربوي', 'guide', 'pedagog'];
    const found = guideKeywords.filter(k => blob.includes(k));

    // interaction types
    const interactions: string[] = [];
    const walk = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) { obj.forEach(walk); return; }
      for (const [k, v] of Object.entries(obj)) {
        if (k === 'interaction_type' && typeof v === 'string') interactions.push(v);
        walk(v);
      }
    };
    walk(sd);
    const dist: Record<string, number> = {};
    for (const i of interactions) dist[i] = (dist[i] ?? 0) + 1;

    console.log(`\n  5-3 P${r.period_number}:`);
    console.log(`    formulas.length = ${Array.isArray(formulas) ? formulas.length : 'N/A (not array)'}`);
    console.log(`    formulas sample = ${JSON.stringify(formulas).slice(0, 200)}`);
    console.log(`    guide philosophy keywords found = ${found.length > 0 ? 'YES' : 'NO'} (${found.join(', ') || 'none'})`);
    console.log(`    interaction_type distribution (total=${interactions.length}):`);
    for (const [k, v] of Object.entries(dist)) console.log(`      ${k}: ${v}`);
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
