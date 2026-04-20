import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  for (const t of ['curriculum_sources', 'curriculum_pages']) {
    const cols = (await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns WHERE table_name = ${t}
      ORDER BY ordinal_position
    `)) as Array<Record<string, unknown>>;
    console.log(`=== ${t} ===`);
    console.table(cols);
  }
  const sample = (await db.execute(sql`
    SELECT s.id, s.kind, s.book, s.unit_number, s.lesson_number, COUNT(p.id)::int AS pages
    FROM curriculum_sources s LEFT JOIN curriculum_pages p ON p.source_id = s.id
    WHERE s.unit_number = 5
    GROUP BY s.id ORDER BY s.lesson_number, s.book
  `)) as Array<Record<string, unknown>>;
  console.log('=== unit 5 sources ===');
  console.table(sample);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
