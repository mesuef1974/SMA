delete process.env.ANTHROPIC_BASE_URL;
delete process.env.ANTHROPIC_AUTH_TOKEN;
delete process.env.ANTHROPIC_API_KEY;
import { config } from 'dotenv';
config({ path: '.env.local', override: true });
import { sql } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/db');
  const rows = (await db.execute(sql`
    SELECT l.number AS lesson, lp.period_number, lp.section_data::text AS data
    FROM lesson_plans lp
    JOIN lessons l ON l.id=lp.lesson_id
    JOIN chapters c ON c.id=l.chapter_id
    WHERE c.number='5'
    ORDER BY l.number, lp.period_number
  `)) as Array<{ lesson: string; period_number: number; data: string }>;

  console.log('\nPlan                  | Artifacts | Pedagogy | StudentBook | TeacherGuide | MC | Bloom');
  console.log('----------------------+-----------+----------+-------------+--------------+----+------');
  for (const r of rows) {
    const hasArtifact = /egin\{|\\ext\{|\brac\{/.test(r.data);
    const hasPedagogy = /دليل المعلم|فلسفة|النهج التربوي/.test(r.data);
    const hasStudentBook = /كتاب الطالب/.test(r.data);
    const hasTeacherGuide = /"teacher_guide_page"\s*:\s*\d+/.test(r.data);
    const mcCount = (r.data.match(/\[MC-/g) || []).length;
    const bloomCount = (r.data.match(/"bloom_level"/g) || []).length;
    console.log(
      `${r.lesson.padEnd(8)} P${r.period_number}           | ${String(hasArtifact).padEnd(9)} | ${String(hasPedagogy).padEnd(8)} | ${String(hasStudentBook).padEnd(11)} | ${String(hasTeacherGuide).padEnd(12)} | ${String(mcCount).padEnd(2)} | ${bloomCount}`,
    );
  }
  process.exit(0);
}
main();
