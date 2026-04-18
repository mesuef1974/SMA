/**
 * Latin-numeral filter (D-28)
 *
 * Recursively walks any value and converts Eastern-Arabic digits (٠-٩) to
 * Latin digits (0-9) inside string values. Numbers / booleans / null are
 * passed through untouched. Object keys are NOT rewritten (schema field
 * names must stay in Latin).
 *
 * Care is taken NOT to mutate digits *inside* LaTeX math segments — those
 * blocks are delimited by `$...$`, `$$...$$`, `\(...\)`, or `\[...\]`. We
 * preserve the original digits inside such segments verbatim.
 */

const AR_TO_LATIN: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

const ARABIC_DIGIT_RE = /[٠-٩]/g;

/**
 * Splits a string into alternating non-LaTeX / LaTeX segments. The LaTeX
 * delimiters supported (in priority order): `$$...$$`, `\[...\]`, `\(...\)`,
 * `$...$`. The returned array preserves order; each segment carries an
 * `isMath` flag so callers can decide whether to transform it.
 */
function segmentByLatex(input: string): Array<{ text: string; isMath: boolean }> {
  // Combined regex — order matters: longer/more-specific delimiters first.
  // Using non-greedy bodies. The "g" flag drives sequential extraction.
  const re = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;

  const out: Array<{ text: string; isMath: boolean }> = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(input)) !== null) {
    if (match.index > lastIdx) {
      out.push({ text: input.slice(lastIdx, match.index), isMath: false });
    }
    out.push({ text: match[0], isMath: true });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < input.length) {
    out.push({ text: input.slice(lastIdx), isMath: false });
  }
  return out;
}

function convertString(input: string): string {
  if (!ARABIC_DIGIT_RE.test(input)) return input;
  // Reset lastIndex (RegExp with /g is stateful when used with .test).
  ARABIC_DIGIT_RE.lastIndex = 0;

  const segments = segmentByLatex(input);
  return segments
    .map((seg) =>
      seg.isMath
        ? seg.text
        : seg.text.replace(ARABIC_DIGIT_RE, (d) => AR_TO_LATIN[d] ?? d),
    )
    .join('');
}

/**
 * Deep-walks the value and returns a new structure with Eastern-Arabic
 * digits in string leaves replaced by Latin digits. Non-string primitives
 * are returned as-is. Arrays and plain objects are recursed.
 */
export function filterToLatinNumerals(obj: unknown): unknown {
  if (typeof obj === 'string') return convertString(obj);
  if (Array.isArray(obj)) return obj.map((v) => filterToLatinNumerals(v));
  if (obj !== null && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = filterToLatinNumerals(v);
    }
    return out;
  }
  return obj;
}
