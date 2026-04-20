/**
 * Destructive: deletes ALL rows from lesson_plans.
 * Run intentionally only — there is no soft-delete.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  const before = (await db.execute(sql`SELECT COUNT(*)::int AS n FROM lesson_plans`)) as Array<{ n: number }>;
  console.log('before:', before[0]?.n);
  await db.execute(sql`DELETE FROM lesson_plans`);
  const after = (await db.execute(sql`SELECT COUNT(*)::int AS n FROM lesson_plans`)) as Array<{ n: number }>;
  console.log('after :', after[0]?.n);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
