/**
 * LaTeX sanitizer — normalize LaTeX coming from LLMs + JSON round-trips.
 *
 * Three classes of problems we fix:
 *
 *  (1) ChatGPT-style delimiters Qwen/Ollama emits natively:
 *         \( ... \)  → $ ... $
 *         \[ ... \]  → $$ ... $$
 *      Our MathText parser only recognizes $...$ / $$...$$, so we normalize.
 *
 *  (2) JSON round-trip damage — when a model outputs an *unescaped* control
 *      sequence inside a JSON string (e.g. `\begin`, `\text`, `\frac`), the
 *      naive JSON.parse either rejects it (invalid escape) or — if upstream
 *      code tries to "repair" by dropping the backslash — the letter that
 *      follows the backslash becomes a bare escape artifact:
 *         \begin{cases}  →  egin{cases}
 *         \text{...}     →  ext{...}
 *         \frac{a}{b}    →  rac{a}{b}
 *         \sum_{...}     →  um_{...}
 *      We re-introduce the missing backslash when the surrounding shape is
 *      unambiguously LaTeX (`{...}` or `_{...}` adjacency).
 *
 *  (3) Double-escaped backslashes from round-tripping JSON twice:
 *         `\\\\frac` → `\\frac` (handled by KaTeX itself, but we normalize
 *         the obvious `\\(` / `\\[` pair artifacts if present).
 *
 * The sanitizer is idempotent — safe to run multiple times.
 *
 * NOTE: this does NOT Arabic-translate LaTeX, does NOT strip dollar
 * delimiters, and does NOT alter well-formed `$...$` / `$$...$$` content.
 */

// JSON round-trip drift happens because the model emits a LaTeX control
// sequence like `\text` inside a JSON string without doubling the
// backslash. JSON defines `\b` `\f` `\n` `\r` `\t` as escape codes — so
// when `JSON.parse` sees them:
//     `"\text"`   →  TAB        + "ext"
//     `"\frac"`   →  FORM-FEED  + "rac"
//     `"\begin"`  →  BACKSPACE  + "egin"
// For sequences whose first letter is NOT a valid escape (e.g. `\sum`,
// `\lim`, `\sqrt`), `JSON.parse` throws — so upstream `repairBackslashes`
// may have either preserved the backslash (giving valid `\sum`) or
// stripped it (giving bare `um`).
//
// Strategy:
//  A. First pass — drop the specific control chars that are artefacts of
//     JSON-escape drift and stand immediately before a LaTeX fragment.
//     We only match patterns that are unambiguously LaTeX drift
//     (the control char + literal letter sequence + `{`).
//  B. Second pass — for bare-letter drifts like `rac{` / `um_{` that
//     appear after a non-letter, non-backslash boundary (e.g. start of
//     string, space, `{`, `=`), re-insert the leading backslash.
//
// Both passes are conservative and only fire on the exact LaTeX shapes
// enumerated below — never on bare English/Arabic words.

// Pass A: control-char drift. The control char came from JSON-escape of
// a bare backslash command. Replace `<CTRL>ext{` → `\text{` etc.
const CONTROL_CHAR_DRIFT: Array<[RegExp, string]> = [
  [/\u0008egin\{/g, '\\begin{'],     // BACKSPACE + egin{  → \begin{
  [/\u0009ext\{/g, '\\text{'],        // TAB      + ext{   → \text{
  [/\u000Crac\{/g, '\\frac{'],        // FORM-FEED+ rac{   → \frac{
  // Match paired \end{env} after \begin{env}: JSON escapes in `\end` differ
  // (`\e` is invalid, so usually survives as `\end`), but if a driver
  // stripped the backslash we also accept bare `end{env}` on the second pass.
];

// Pass B: bare-letter drift after a clear non-letter boundary.
// IMPORTANT: `\sum_{`, `\lim_{` keep the `_` before `{`; `\text{`, `\frac{`,
// `\begin{`, `\sqrt{` do NOT. So we enumerate exact trailers.
const BARE_LETTER_DRIFT: Array<[RegExp, string]> = [
  // env names — only well-known LaTeX environments to avoid matching Arabic
  // words that end in "egin" / "end":
  [/(^|[^\\A-Za-z])egin\{(pmatrix|bmatrix|vmatrix|cases|array|aligned|align|matrix|equation|gather|split)\}/g, '$1\\begin{$2}'],
  [/(^|[^\\A-Za-z])end\{(pmatrix|bmatrix|vmatrix|cases|array|aligned|align|matrix|equation|gather|split)\}/g, '$1\\end{$2}'],
  // text{  — only when followed by `{` and preceded by math-boundary
  [/(^|[^\\A-Za-z])ext\{/g, '$1\\text{'],
  // frac{  — requires double-braces shape to avoid false positives
  [/(^|[^\\A-Za-z])rac\{([^{}]*)\}\{/g, '$1\\frac{$2}{'],
  // sum_{  / lim_{
  [/(^|[^\\A-Za-z])um_\{/g, '$1\\sum_{'],
  [/(^|[^\\A-Za-z])im_\{/g, '$1\\lim_{'],
  // sqrt{
  [/(^|[^\\A-Za-z])qrt\{/g, '$1\\sqrt{'],
];

/**
 * Normalize ChatGPT-style LaTeX delimiters to our $/$$ convention.
 * Runs before the JSON-drift repairs.
 */
function normalizeDelimiters(input: string): string {
  let s = input;
  // Handle double-escaped artefacts first: `\\(` → `\(`, `\\[` → `\[`.
  // These can appear if content was JSON-stringified twice.
  s = s.replace(/\\\\\(/g, '\\(').replace(/\\\\\)/g, '\\)');
  s = s.replace(/\\\\\[/g, '\\[').replace(/\\\\\]/g, '\\]');
  // \(...\) → $...$
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_, body: string) => `$${body}$`);
  // \[...\] → $$...$$
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_, body: string) => `$$${body}$$`);
  return s;
}

/** Repair JSON-round-trip artifacts (egin → \begin, etc.). */
function repairArtifacts(input: string): string {
  let s = input;
  // Pass A: drop/replace specific control-char drift.
  for (const [re, sub] of CONTROL_CHAR_DRIFT) {
    s = s.replace(re, sub);
  }
  // Pass B: bare-letter drift (no control char, just a missing backslash).
  for (const [re, sub] of BARE_LETTER_DRIFT) {
    s = s.replace(re, sub);
  }
  return s;
}

/**
 * Top-level sanitizer — applies delimiter normalization + artifact repair.
 *
 * Idempotent: running twice yields the same result.
 */
export function sanitizeLatex(input: string): string {
  if (!input) return input;
  return repairArtifacts(normalizeDelimiters(input));
}

/**
 * Sanitize a string that is *known* to be a standalone LaTeX expression
 * (e.g. an item of a `formulas[]` array). Does NOT wrap in `$` — the caller
 * renders it directly through `<MathDisplay>`. Still runs delimiter
 * normalization in case the model wrapped it anyway.
 */
export function sanitizeLatexExpression(input: string): string {
  if (!input) return input;
  let s = sanitizeLatex(input).trim();
  // If the whole thing is wrapped in $...$ or $$...$$, strip those.
  if (s.startsWith('$$') && s.endsWith('$$')) s = s.slice(2, -2).trim();
  else if (s.startsWith('$') && s.endsWith('$')) s = s.slice(1, -1).trim();
  return s;
}

/**
 * Walk an arbitrary JSON-like value and sanitize every string leaf
 * in-place-style (returns new object). Used after `autoRepair` in the
 * lesson-plan pipeline, before Zod validation — the schema sees clean
 * LaTeX so gates that check LaTeX syntax never false-fail.
 */
export function sanitizeLatexDeep<T>(value: T): T {
  if (value == null) return value;
  if (typeof value === 'string') return sanitizeLatex(value) as unknown as T;
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeLatexDeep(v)) as unknown as T;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeLatexDeep(v);
    }
    return out as unknown as T;
  }
  return value;
}
