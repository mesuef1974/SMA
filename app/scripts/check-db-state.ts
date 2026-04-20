import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  const tables = (await db.execute(sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND (table_name LIKE '%curriculum%' OR table_name LIKE '%lesson%' OR table_name LIKE '%source%')
    ORDER BY table_name
  `)) as Array<{ table_name: string }>;
  console.log('=== relevant tables ===');
  console.table(tables);

  try {
    const lp = (await db.execute(sql`SELECT COUNT(*)::int AS n FROM lesson_plans`)) as Array<{ n: number }>;
    console.log('lesson_plans rows:', lp[0]?.n);
  } catch (e: unknown) { console.log('lesson_plans:', (e as Error).message); }

  try {
    const cs = (await db.execute(sql`SELECT COUNT(*)::int AS n FROM curriculum_sources`)) as Array<{ n: number }>;
    console.log('curriculum_sources rows:', cs[0]?.n);
    const cp = (await db.execute(sql`SELECT COUNT(*)::int AS n FROM curriculum_pages`)) as Array<{ n: number }>;
    console.log('curriculum_pages rows:', cp[0]?.n);
  } catch (e: unknown) { console.log('curriculum_sources:', (e as Error).message); }

  const u5 = (await db.execute(sql`
    SELECT l.id, l.number, l.title_ar, l.page_start_te, l.page_end_te, l.page_start_se, l.page_end_se
    FROM lessons l JOIN chapters c ON l.chapter_id = c.id
    WHERE c.number = 5 ORDER BY l.number
  `)) as Array<Record<string, unknown>>;
  console.log('=== unit 5 lessons ===');
  console.table(u5);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
