import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  const rows = await db.execute(sql`
    SELECT lp.id, lp.period_number, lp.created_at, l.number AS lesson_number, l.title_ar
    FROM lesson_plans lp
    JOIN lessons l ON l.id = lp.lesson_id
    ORDER BY lp.created_at DESC LIMIT 15
  `);
  console.log('=== recent lesson_plans ===');
  console.table(rows);

  const perPeriod = await db.execute(sql`
    SELECT period_number, COUNT(*)::int AS n
    FROM lesson_plans
    GROUP BY period_number ORDER BY period_number
  `);
  console.log('=== count per period ===');
  console.table(perPeriod);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
