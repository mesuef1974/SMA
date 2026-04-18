#!/usr/bin/env node
/**
 * Brand guard: reject hardcoded hex colors in components/app source.
 *
 * Rationale: LL-FS-2dbac9 — audits repeatedly missed hex literals sneaking into
 * components. Only a pre-commit hard-block has proven effective. All colors
 * MUST come from design tokens in globals.css (var(--sma-najm-700), etc.).
 *
 * Escape hatch: add a `// BRAND-APPROVED: <reason>` comment on the same line
 * or the line above. The reason makes the approval auditable.
 *
 * Allowlist: files with legitimate hex usage (the Logo SVG, for example).
 */
import { readFileSync } from 'node:fs';

const ALLOWLIST = [
  /components[\\/]brand[\\/]Logo\.tsx$/,
];

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const BRAND_APPROVED_RE = /BRAND-APPROVED/;

let failed = false;
const files = process.argv.slice(2);

for (const f of files) {
  if (ALLOWLIST.some((re) => re.test(f))) continue;
  const content = readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (
      HEX_RE.test(line) &&
      !BRAND_APPROVED_RE.test(line) &&
      !BRAND_APPROVED_RE.test(lines[i - 1] || '')
    ) {
      console.error(`\u2717 ${f}:${i + 1} \u2014 hardcoded hex: ${line.trim()}`);
      console.error(
        '  \u2192 use a design token from globals.css (e.g. var(--sma-najm-700)) or add "// BRAND-APPROVED: reason" comment above/on the same line.',
      );
      failed = true;
    }
  });
}

if (failed) process.exit(1);
