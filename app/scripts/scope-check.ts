import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  const chapters = await db.execute(sql`
    SELECT c.number AS chapter_num, c.title_ar,
           COUNT(l.id)::int AS lesson_count,
           MIN(l.page_start_te)::int AS min_te, MAX(l.page_end_te)::int AS max_te,
           MIN(l.page_start_se)::int AS min_se, MAX(l.page_end_se)::int AS max_se
    FROM chapters c
    LEFT JOIN lessons l ON l.chapter_id = c.id
    GROUP BY c.id, c.number, c.title_ar
    ORDER BY c.number
  `);
  console.log('=== chapters with page ranges ===');
  console.table(chapters);

  const lessons = await db.execute(sql`
    SELECT l.number, l.title_ar, l.page_start_te, l.page_end_te, l.page_start_se, l.page_end_se
    FROM lessons l ORDER BY l.number
  `);
  console.log('=== all lessons ===');
  console.table(lessons);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
