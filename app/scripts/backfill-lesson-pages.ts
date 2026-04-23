import { config } from 'dotenv';
config({ path: '.env.local' });
import { sql } from 'drizzle-orm';
import { readFileSync } from 'node:fs';

type LessonEntry = {
  number: string;
  title_ar?: string;
  te: { start: number; end: number };
  se: { start: number; end: number };
};

type PageMap = {
  lessons: LessonEntry[];
};

async function main() {
  const { db } = await import('../src/db');

  const mapPath = 'D:/SMA/docs/lessons-page-map.json';
  const raw = readFileSync(mapPath, 'utf8');
  const data: PageMap = JSON.parse(raw);

  let updated = 0;
  const total = data.lessons.length;

  for (const lesson of data.lessons) {
    const num = lesson.number;
    const teStart = lesson.te.start;
    const teEnd = lesson.te.end;
    const seStart = lesson.se.start;
    const seEnd = lesson.se.end;

    await db.execute(sql`
      UPDATE lessons
      SET page_start_te = ${teStart},
          page_end_te   = ${teEnd},
          page_start_se = ${seStart},
          page_end_se   = ${seEnd}
      WHERE number = ${num}
    `);

    // Verify via SELECT (postgres.js does not surface UPDATE rowCount reliably through drizzle.execute)
    const verify = await db.execute(sql`
      SELECT page_start_te, page_end_te, page_start_se, page_end_se
      FROM lessons
      WHERE number = ${num}
    `);
    const rows = (verify as { rows?: Array<Record<string, number | null>> }).rows ??
      (verify as unknown as Array<Record<string, number | null>>);
    const row = rows?.[0];

    if (
      row &&
      row.page_start_te === teStart &&
      row.page_end_te === teEnd &&
      row.page_start_se === seStart &&
      row.page_end_se === seEnd
    ) {
      updated += 1;
      console.log(`[${num}]: TE [${teStart}-${teEnd}] SE [${seStart}-${seEnd}] \u2713`);
    } else {
      console.warn(`[${num}]: MISMATCH or NOT FOUND`, row ?? 'no row');
    }
  }

  console.log(`\nUpdated ${updated}/${total} lessons`);

  const nullRows = await db.execute(sql`
    SELECT number, page_start_te, page_end_te
    FROM lessons
    WHERE page_start_te IS NULL
  `);
  const nullArr =
    (nullRows as { rows?: unknown[] }).rows ??
    (nullRows as unknown as unknown[]);
  const nullCount = Array.isArray(nullArr) ? nullArr.length : 0;
  console.log(`Remaining NULL page_start_te rows: ${nullCount}`);
  if (nullCount > 0) {
    console.table(nullArr);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
