import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  const sources = await db.execute(sql`
    SELECT kind, book, unit_number, lesson_number, page_start, page_end
    FROM curriculum_sources
    ORDER BY book, kind, unit_number NULLS FIRST, lesson_number NULLS FIRST
  `);
  console.log('=== curriculum_sources ===');
  console.table(sources);

  const pageCount = await db.execute(sql`SELECT COUNT(*)::int AS n FROM curriculum_pages`);
  console.log('=== total pages:', pageCount[0]);

  const withFigures = await db.execute(sql`
    SELECT cs.book, cs.kind, cs.lesson_number,
           COUNT(*) FILTER (WHERE jsonb_array_length(cp.figures) > 0)::int AS pages_with_figs,
           COALESCE(SUM(jsonb_array_length(cp.figures)), 0)::int AS total_figs
    FROM curriculum_pages cp
    JOIN curriculum_sources cs ON cs.id = cp.source_id
    GROUP BY cs.id, cs.book, cs.kind, cs.lesson_number
    ORDER BY cs.book, cs.kind
  `);
  console.log('=== figures attached ===');
  console.table(withFigures);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
