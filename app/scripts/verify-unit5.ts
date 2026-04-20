import { config } from 'dotenv'; config({ path: '.env.local' });
import { sql } from 'drizzle-orm';
async function main() {
  const { db } = await import('../src/db');
  const r = (await db.execute(sql`
    SELECT l.number, lp.period_number, lp.status,
           (lp.ai_suggestions->>'model') AS model,
           lp.created_at
    FROM lesson_plans lp JOIN lessons l ON lp.lesson_id = l.id
    WHERE l.number IN ('5-1','5-2','5-3','5-4')
    ORDER BY l.number, lp.period_number
  `)) as Array<Record<string, unknown>>;
  console.table(r);
  console.log('total:', r.length);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
