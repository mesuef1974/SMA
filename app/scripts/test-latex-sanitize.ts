/**
 * test-latex-sanitize.ts
 *
 * Unit-level checks for `src/lib/latex/sanitize.ts` plus a real-data probe:
 * pull lesson 5-2 from the DB, extract every string leaf that *looks* like
 * it contains math (backslash, `$`, underscore/caret/brace), sanitize it,
 * and render through `katex.renderToString` with `throwOnError:true`.
 *
 * Any KaTeX parse error is a fail — the sanitizer is supposed to recover.
 *
 * Run:   bun run scripts/test-latex-sanitize.ts
 */
import { config } from 'dotenv'; config({ path: '.env.local' });
import katex from 'katex';
import { sql } from 'drizzle-orm';

// Silence KaTeX "No character metrics for '…'" warnings — these are
// cosmetic font-coverage notices for Arabic glyphs in \text{} blocks
// (the browser uses font fallback; in Node there's no font). They're
// not rendering errors.
const _origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const s = String(args[0] ?? '');
  if (s.startsWith('No character metrics')) return;
  _origWarn(...(args as [unknown, ...unknown[]]));
};
import { sanitizeLatex, sanitizeLatexExpression, sanitizeLatexDeep } from '../src/lib/latex/sanitize';

type Case = { name: string; input: string; expect: (s: string) => boolean };

const unit: Case[] = [
  {
    name: 'inline \\(..\\) → $..$',
    input: 'المعادلة هي \\(f(x)=x^2\\) فقط.',
    expect: (s) => s.includes('$f(x)=x^2$') && !s.includes('\\('),
  },
  {
    name: 'display \\[..\\] → $$..$$',
    input: 'الناتج \\[\\frac{a}{b}\\] واضح.',
    expect: (s) => s.includes('$$\\frac{a}{b}$$') && !s.includes('\\['),
  },
  {
    name: 'egin{cases} → \\begin{cases}',
    input: 'f(x) = egin{cases} x, & x\\ge 0 \\\\ -x, & x<0 end{cases}',
    expect: (s) => s.includes('\\begin{cases}') && s.includes('\\end{cases}'),
  },
  {
    name: 'ext{..} → \\text{..}',
    input: '$y = ext{max}(0, x)$',
    // After repair the only `ext{` occurrence is inside `\text{`.
    expect: (s) => s.includes('\\text{max}'),
  },
  {
    name: 'control-char variant: TAB+ext{..} → \\text{..}',
    input: '$y = \u0009ext{max}(0, x)$',
    expect: (s) => s.includes('\\text{max}') && !/[\u0008\u0009\u000C]ext\{/.test(s),
  },
  {
    name: 'control-char variant: FF+rac{a}{b} → \\frac{a}{b}',
    input: '$x = \u000Crac{a}{b}$',
    expect: (s) => s.includes('\\frac{a}{b}') && !/[\u0008\u0009\u000C]rac\{/.test(s),
  },
  {
    name: 'control-char variant: BS+egin{cases} → \\begin{cases}',
    input: '$\u0008egin{cases} 1 \\\\ 2 \\end{cases}$',
    expect: (s) => s.includes('\\begin{cases}') && !/[\u0008\u0009\u000C]egin\{/.test(s),
  },
  {
    name: 'does NOT damage valid \\text{..}',
    input: '\\text{abc}',
    expect: (s) => s === '\\text{abc}',
  },
  {
    name: 'does NOT damage valid \\frac{a}{b}',
    input: '\\frac{a}{b}',
    expect: (s) => s === '\\frac{a}{b}',
  },
  {
    name: 'does NOT damage valid \\begin{cases}',
    input: '\\begin{cases} a \\end{cases}',
    expect: (s) => s === '\\begin{cases} a \\end{cases}',
  },
  {
    name: 'rac{a}{b} → \\frac{a}{b}',
    input: '$y = rac{a}{b}$',
    expect: (s) => s.includes('\\frac{a}{b}'),
  },
  {
    name: 'um_{i=1}^{n} → \\sum_{i=1}^{n}',
    input: '$S = um_{i=1}^{n} x_i$',
    expect: (s) => s.includes('\\sum_{i=1}^{n}'),
  },
  {
    name: 'idempotent: already clean $..$ passes through',
    input: 'المعادلة $x^2+1$ جيدة.',
    expect: (s) => s === 'المعادلة $x^2+1$ جيدة.',
  },
  {
    name: 'formulas[] expression: \\(f(x)=|x|\\) strips to f(x)=|x|',
    input: '\\(f(x)=|x|\\)',
    expect: () => sanitizeLatexExpression('\\(f(x)=|x|\\)') === 'f(x)=|x|',
  },
  {
    name: 'formulas[] already bare LaTeX passes through',
    input: '\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
    expect: () => sanitizeLatexExpression('\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}') === '\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
  },
  {
    name: 'deep: nested object string leaves all sanitized',
    input: 'N/A',
    expect: () => {
      const obj = { a: '\\(x^2\\)', b: { c: ['egin{cases}y end{cases}'] } };
      const out = sanitizeLatexDeep(obj) as any;
      return out.a === '$x^2$' && out.b.c[0].includes('\\begin{cases}');
    },
  },
];

function tryKatex(tex: string): { ok: true } | { ok: false; err: string } {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: false });
    return { ok: true };
  } catch (e) {
    return { ok: false, err: (e as Error).message.split('\n')[0] };
  }
}

async function main() {
  let pass = 0;
  let fail = 0;
  const failures: string[] = [];

  console.log('\n=== Unit cases ===\n');
  for (const c of unit) {
    const out = sanitizeLatex(c.input);
    const ok = c.expect(out);
    if (ok) { pass++; console.log(`  PASS  ${c.name}`); }
    else { fail++; failures.push(c.name); console.log(`  FAIL  ${c.name}\n    in: ${c.input}\n    out: ${out}`); }
  }

  console.log('\n=== DB probe: lesson 5-2 formulas/concept_ar ===\n');

  let dbCases = 0;
  let dbPass = 0;
  let dbFail = 0;
  try {
    const { db } = await import('../src/db');
    const rows = (await db.execute(sql`
      SELECT l.number, lp.period_number, lp.section_data
      FROM lesson_plans lp
      JOIN lessons l ON lp.lesson_id = l.id
      WHERE l.number = '5-2'
      ORDER BY lp.period_number, lp.updated_at DESC
      LIMIT 4
    `)) as Array<{ number: string; period_number: number; section_data: any }>;

    if (rows.length === 0) {
      console.log('  (no lesson 5-2 rows in DB — skipping probe)');
    }

    for (const r of rows) {
      const explain = r.section_data?.explain ?? {};
      const candidates: Array<{ label: string; value: string; isFormula: boolean }> = [];

      if (typeof explain.concept_ar === 'string') {
        candidates.push({ label: `${r.number}/P${r.period_number}/explain.concept_ar`, value: explain.concept_ar, isFormula: false });
      }
      if (Array.isArray(explain.formulas)) {
        for (let i = 0; i < explain.formulas.length; i++) {
          const f = explain.formulas[i];
          if (typeof f === 'string') {
            candidates.push({ label: `${r.number}/P${r.period_number}/explain.formulas[${i}]`, value: f, isFormula: true });
          }
        }
      }
      if (Array.isArray(explain.worked_examples)) {
        for (let i = 0; i < explain.worked_examples.length; i++) {
          const ex = explain.worked_examples[i];
          if (typeof ex === 'string') {
            candidates.push({ label: `${r.number}/P${r.period_number}/explain.worked_examples[${i}]`, value: ex, isFormula: false });
          }
        }
      }

      for (const c of candidates) {
        // Skip plain text with no math hints — not our concern.
        const hasMath = /[\\^_{}$]/.test(c.value);
        if (!hasMath) continue;
        dbCases++;

        if (c.isFormula) {
          // Formulas[] entries render as standalone expressions.
          const cleaned = sanitizeLatexExpression(c.value);
          const res = tryKatex(cleaned);
          if (res.ok) { dbPass++; }
          else {
            dbFail++;
            failures.push(`${c.label}: ${res.err}`);
            console.log(`  FAIL  ${c.label}\n    raw: ${c.value.slice(0, 120)}\n    san: ${cleaned.slice(0, 120)}\n    err: ${res.err}`);
          }
        } else {
          // Mixed text — extract $..$/$$..$$ chunks and render each.
          const sanitized = sanitizeLatex(c.value);
          const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
          let m: RegExpExecArray | null;
          let chunkIdx = 0;
          let anyFail = false;
          while ((m = re.exec(sanitized)) !== null) {
            chunkIdx++;
            const tex = (m[1] ?? m[2] ?? '').trim();
            if (!tex) continue;
            const res = tryKatex(tex);
            if (!res.ok) {
              dbFail++;
              anyFail = true;
              failures.push(`${c.label} chunk#${chunkIdx}: ${res.err}`);
              console.log(`  FAIL  ${c.label} chunk#${chunkIdx}\n    tex: ${tex.slice(0, 120)}\n    err: ${res.err}`);
            }
          }
          if (!anyFail && chunkIdx > 0) dbPass++;
          else if (chunkIdx === 0) {
            // No $..$ chunks after sanitize — surely no KaTeX render attempt, not a fail.
            dbCases--;
          }
        }
      }
    }
  } catch (e) {
    console.log(`  (DB probe skipped: ${(e as Error).message})`);
  }

  console.log('\n=== Summary ===');
  console.log(`Unit:  ${pass} pass / ${fail} fail  (total ${pass + fail})`);
  console.log(`DB:    ${dbPass} pass / ${dbFail} fail  (total ${dbCases})`);
  if (failures.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  - ${f}`);
  }

  const ok = fail === 0 && dbFail === 0;
  console.log(`\n${ok ? 'OVERALL: PASS' : 'OVERALL: FAIL'}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
