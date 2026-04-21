import { config } from 'dotenv';
config({ path: '.env.local' });
async function main() {
  const { getExampleAsPromptString } = await import('../src/lib/lesson-plans/examples/example-3-1');
  const { buildCatalogPromptReference } = await import('../src/lib/misconceptions/catalog');
  const { buildSemesterPlanBlock } = await import('../src/lib/lesson-plans/semester-plan-q2-2025-26');
  console.log('few-shot example-3-1:', getExampleAsPromptString().length);
  console.log('misconception catalog:', buildCatalogPromptReference().length);
  console.log('semester plan block:  ', buildSemesterPlanBlock().length);
}
main().then(() => process.exit(0));
