import { config } from 'dotenv'; config({ path: '.env.local' });
import { sql } from 'drizzle-orm';
async function main() {
  const { db } = await import('../src/db');
  const cols = (await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'lesson_plans' ORDER BY ordinal_position
  `)) as Array<{column_name: string}>;
  console.log('lesson_plans columns:', cols.map(c => c.column_name).join(', '));
  console.log('---');
  const r = (await db.execute(sql`
    SELECT l.number, lp.period_number, lp.status,
           lp.section_data->'gate_results'->>'advisor_gate' AS advisor_gate,
           lp.updated_at
    FROM lesson_plans lp JOIN lessons l ON lp.lesson_id = l.id
    WHERE l.number IN ('5-1','5-2','5-3','5-4')
    ORDER BY l.number, lp.period_number
  `)) as Array<Record<string, unknown>>;
  console.table(r);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
