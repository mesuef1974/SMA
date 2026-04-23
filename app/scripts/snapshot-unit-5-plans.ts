/**
 * One-shot snapshot: dump all existing lesson_plans for unit 5 to a JSON file
 * under backups/ before regeneration. Also lists each row (code/period/status)
 * for human review.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { mkdirSync, writeFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');

  const rows = (await db.execute(
    sql`SELECT lp.id, l.number as lesson_code, lp.period_number as period,
               lp.status, lp.created_at, lp.section_data, lp.ai_suggestions,
               lp.lesson_id, lp.teacher_id
        FROM lesson_plans lp
        JOIN lessons l ON lp.lesson_id = l.id
        JOIN chapters c ON l.chapter_id = c.id
        WHERE c.number = 5
        ORDER BY l.number, lp.period_number`,
  )) as Array<Record<string, unknown>>;

  console.log(`found ${rows.length} lesson_plans for unit 5:`);
  for (const r of rows) {
    console.log(`  ${r.lesson_code} P${r.period}  ${r.status}  id=${r.id}`);
  }

  mkdirSync('backups', { recursive: true });
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const file = `backups/unit-5-ollama-${stamp}.json`;
  writeFileSync(file, JSON.stringify({ takenAt: now.toISOString(), count: rows.length, rows }, null, 2), 'utf8');
  console.log(`\nsnapshot written: ${file}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
