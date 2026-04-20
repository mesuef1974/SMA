/** Delete failed unit-5 plans (error + rejected_gate) so generate-unit-5 can retry. */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  // delete rejected_gate plans for unit 5 lessons
  const r = (await db.execute(sql`
    DELETE FROM lesson_plans
    WHERE status = 'rejected_gate'
      AND lesson_id IN (SELECT id FROM lessons WHERE number IN ('5-1','5-2','5-3','5-4'))
    RETURNING id, lesson_id, period_number
  `)) as Array<Record<string, unknown>>;
  console.log(`deleted ${r.length} rejected_gate plans:`, r);
  const remain = (await db.execute(sql`
    SELECT l.number, lp.period_number, lp.status FROM lesson_plans lp
    JOIN lessons l ON lp.lesson_id = l.id
    WHERE l.number IN ('5-1','5-2','5-3','5-4') ORDER BY l.number, lp.period_number
  `)) as Array<Record<string, unknown>>;
  console.table(remain);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
