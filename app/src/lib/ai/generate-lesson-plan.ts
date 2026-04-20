/**
 * generateLessonPlan — Ollama-safe lesson plan generation.
 *
 * Uses generateText + JSON parsing instead of generateObject to bypass
 * the Ollama schema_to_grammar crash on complex Zod schemas.
 *
 * For non-Ollama providers (gemini, anthropic), falls through to
 * native generateObject with structured output.
 */
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { getAIModel, PROVIDER } from './provider';

// JSON-aware backslash repair.
// Ollama often emits LaTeX inside JSON strings as `\frac` / `\cdot` / `\sum`
// (single backslash) which is invalid JSON. We scan string-by-string and
// escape any lone backslash that isn't already a valid escape.
// `\\` is treated as ONE already-valid escape (skipped atomically).
function repairBackslashes(s: string): string {
  const valid = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u']);
  let out = '';
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!inStr) {
      out += ch;
      if (ch === '"') inStr = true;
      continue;
    }
    // inside string
    if (ch === '"') { out += ch; inStr = false; continue; }
    if (ch === '\\') {
      const next = s[i + 1];
      if (next && valid.has(next)) {
        // valid escape — keep both chars verbatim
        out += ch + next;
        i++;
      } else {
        // lone backslash — double it
        out += '\\\\';
      }
    } else {
      out += ch;
    }
  }
  return out;
}

// extract JSON object from free-form text (handles ```json fences, etc.)
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  const body = (start >= 0 && end > start) ? raw.slice(start, end + 1) : raw;

  try { return JSON.parse(body); } catch {}
  // retry after repairing lone backslashes (LaTeX in Arabic content drifts)
  try { return JSON.parse(repairBackslashes(body)); } catch (e) {
    throw e;
  }
}

/** Fill section-level teacher_guide_page from first item's page when missing. */
function autoRepair(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  const obj = input as Record<string, unknown>;
  for (const key of ['practice', 'assess'] as const) {
    const section = obj[key];
    if (!section || typeof section !== 'object') continue;
    const s = section as Record<string, unknown>;
    if (typeof s.teacher_guide_page !== 'number' && Array.isArray(s.items)) {
      const firstItem = s.items.find(
        (i) => i && typeof i === 'object' && typeof (i as Record<string, unknown>).teacher_guide_page === 'number',
      );
      if (firstItem) {
        s.teacher_guide_page = (firstItem as Record<string, unknown>).teacher_guide_page;
      }
    }
  }
  return obj;
}

export async function generateLessonPlan<T>(opts: {
  schema: z.ZodType<T>;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  abortSignal?: AbortSignal;
}): Promise<{ object: T; rawText?: string; ms: number }> {
  const t0 = Date.now();
  const model = getAIModel();

  if (PROVIDER !== 'ollama') {
    // native structured output for gemini/anthropic
    const res = await generateObject({
      model,
      schema: opts.schema,
      messages: [
        { role: 'system', content: opts.systemPrompt },
        { role: 'user', content: opts.userPrompt },
      ],
      temperature: opts.temperature ?? 0.3,
      abortSignal: opts.abortSignal,
    });
    return { object: res.object, ms: Date.now() - t0 };
  }

  // Ollama path: generateText + manual JSON parsing + Zod validate.
  // Inject the JSON Schema derived from Zod so the model knows exact field
  // names (teacher_minutes, student_minutes, qncf_code, teacher_guide_page …).
  // Without this the model hallucinates plausible-but-wrong names like
  // `duration_minutes` or `source_page`.
  let schemaText = '';
  try {
    const js = z.toJSONSchema(opts.schema as z.ZodType);
    schemaText = JSON.stringify(js, null, 2);
  } catch {
    schemaText = '';
  }
  const jsonInstruction =
    '\n\n## JSON Schema المطلوبة (استخدم أسماء الحقول بالضبط):\n```json\n' +
    schemaText +
    '\n```\n\nاستجب **فقط** بـ JSON صالح مطابق لهذا الـ schema بالضبط (أسماء الحقول حرفياً — teacher_minutes, student_minutes, qncf_code, teacher_guide_page…). لا نص إضافي، لا تعليقات، لا ```json fences.';
  const res = await generateText({
    model,
    messages: [
      { role: 'system', content: opts.systemPrompt + jsonInstruction },
      { role: 'user', content: opts.userPrompt },
    ],
    temperature: opts.temperature ?? 0.3,
    abortSignal: opts.abortSignal,
  });

  let parsedRaw: unknown;
  try {
    parsedRaw = extractJson(res.text);
  } catch (jsonErr) {
    try {
      const fs = await import('node:fs');
      fs.writeFileSync('ollama-raw-last.json', res.text, 'utf8');
    } catch {}
    throw jsonErr;
  }
  // Defensive auto-repair: small, deterministic drifts Ollama consistently
  // produces. Not magic — only fills fields whose value can be inferred from
  // sibling fields (not hallucination). Keeps the schema contract strict.
  const parsed = autoRepair(parsedRaw);
  try {
    const validated = opts.schema.parse(parsed);
    return { object: validated, rawText: res.text, ms: Date.now() - t0 };
  } catch (zodErr) {
    // persist raw for debugging — Ollama JSON often drifts from schema
    try {
      const fs = await import('node:fs');
      fs.writeFileSync('ollama-raw-last.json', res.text, 'utf8');
      fs.writeFileSync('ollama-parsed-last.json', JSON.stringify(parsed, null, 2), 'utf8');
    } catch {}
    throw zodErr;
  }
}
