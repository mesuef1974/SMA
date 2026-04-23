/**
 * Measure sizes of the source layers that feed the lesson-plan system prompt.
 * Pure read — no AI call.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const q = await import('../src/db/queries/curriculum-sources');
  const guide = await q.getGuidePhilosophy();
  const u5te = await q.getUnitIntro(5, 'TE');
  const l51te = await q.getLessonContent(5, 1, 'TE');
  const l51se = await q.getLessonContent(5, 1, 'SE');

  const rows: Array<readonly [string, typeof guide]> = [
    ['guide (TE philosophy)', guide],
    ['unit 5 intro (TE)', u5te],
    ['lesson 5-1 (TE)', l51te],
    ['lesson 5-1 (SE)', l51se],
  ];

  let total = 0;
  for (const [name, src] of rows) {
    const chars = src?.pages.reduce((s, p) => s + (p.contentAr?.length ?? 0), 0) ?? 0;
    total += chars;
    console.log(`${name.padEnd(30)}  pages=${String(src?.pages.length ?? 0).padStart(3)}  chars=${String(chars).padStart(7)}  ~KB=${(chars / 1024).toFixed(1)}`);
  }
  console.log(`${'TOTAL LAYERS'.padEnd(30)}  chars=${String(total).padStart(7)}  ~KB=${(total / 1024).toFixed(1)}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
