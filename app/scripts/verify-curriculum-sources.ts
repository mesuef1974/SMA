import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { getGuidePhilosophy, getUnitIntro, getLessonContent } = await import(
    '../src/db/queries/curriculum-sources'
  );

  const guide = await getGuidePhilosophy();
  const u5 = await getUnitIntro(5, 'TE');
  const l51te = await getLessonContent(5, 1, 'TE');
  const l51se = await getLessonContent(5, 1, 'SE');

  console.log('guide:', guide ? `${guide.pages.length} pages` : 'null');
  console.log('u5 intro TE:', u5 ? `${u5.pages.length} pages` : 'null');
  console.log(
    'l5-1 TE:',
    l51te
      ? `${l51te.pages.length} pages, first 200 chars: ${l51te.pages[0]?.contentAr?.slice(0, 200)}`
      : 'null',
  );
  console.log('l5-1 SE:', l51se ? `${l51se.pages.length} pages` : 'null');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
