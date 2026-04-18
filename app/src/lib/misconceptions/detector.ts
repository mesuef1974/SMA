import { getAIModel } from '@/lib/ai/provider';
// ---------------------------------------------------------------------------
// Misconception Detection Engine
// Uses Claude AI (structured output) + regex-based pre-screening
// ---------------------------------------------------------------------------

import { generateObject } from 'ai';

import { z } from 'zod';

import {
  MISCONCEPTION_CATALOG,
  buildCatalogPromptReference,
  type MisconceptionEntry,
} from './catalog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetectedMisconception {
  code: string;
  confidence: number; // 0.0 to 1.0
  evidence: string; // What in the student's response triggered this
  remediation: string; // Arabic remediation suggestion
}

export interface DetectionResult {
  detected: boolean;
  misconceptions: DetectedMisconception[];
}

export interface DetectionContext {
  lessonTopic?: string;
  questionText?: string;
  expectedAnswer?: string;
  locale?: 'ar' | 'en';
}

export interface PatternMatch {
  code: string;
  pattern: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Zod schemas for structured AI output
// ---------------------------------------------------------------------------

const detectedMisconceptionSchema = z.object({
  code: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  remediation: z.string(),
});

const detectionResultSchema = z.object({
  detected: z.boolean(),
  misconceptions: z.array(detectedMisconceptionSchema),
});

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(locale: 'ar' | 'en'): string {
  const catalog = buildCatalogPromptReference();

  if (locale === 'ar') {
    return `أنت خبير في تحليل أخطاء الرياضيات وتشخيص المفاهيم الخاطئة لدى طلاب الصف الحادي عشر — المسار الأدبي — دولة قطر.

## مهمتك:
حلّل إجابة الطالب وحدد أي مفاهيم خاطئة (misconceptions) موجودة من القائمة التالية المكونة من 18 خطأ شائعاً.

## قائمة المفاهيم الخاطئة الموثقة:
${catalog}

## التعليمات:
1. اقرأ إجابة الطالب بعناية.
2. قارنها بالإجابة المتوقعة (إن وُجدت).
3. حدد أي مفاهيم خاطئة من القائمة أعلاه تظهر في إجابة الطالب.
4. لكل مفهوم خاطئ تم اكتشافه:
   - أعطِ درجة ثقة (0.0 إلى 1.0) بناءً على مدى وضوح الخطأ.
   - اذكر الدليل المحدد من إجابة الطالب الذي يشير إلى هذا الخطأ.
   - قدّم نصيحة علاجية مختصرة باللغة العربية.
5. إذا لم تجد أي مفهوم خاطئ، أعد detected = false ومصفوفة فارغة.

## ملاحظات:
- استخدم فقط الرموز من القائمة أعلاه (مثل MC-ALG-001).
- لا تخترع مفاهيم خاطئة غير موجودة في القائمة.
- درجة الثقة 0.8+ تعني أنك متأكد بشدة، 0.5-0.8 متوسطة، أقل من 0.5 احتمال ضعيف.
- النصيحة العلاجية يجب أن تكون مختصرة ومفيدة وموجهة للطالب مباشرة.`;
  }

  return `You are an expert in analyzing math errors and diagnosing misconceptions for Grade 11 students — Literary Track — State of Qatar.

## Your Task:
Analyze the student's response and identify any misconceptions from the following list of 18 documented common errors.

## Documented Misconceptions Catalog:
${catalog}

## Instructions:
1. Read the student's response carefully.
2. Compare it with the expected answer (if provided).
3. Identify any misconceptions from the catalog above that appear in the student's response.
4. For each detected misconception:
   - Assign a confidence score (0.0 to 1.0) based on how clearly the error manifests.
   - Cite specific evidence from the student's response that indicates this error.
   - Provide a brief remediation suggestion in Arabic.
5. If no misconception is found, return detected = false and an empty array.

## Notes:
- Use only codes from the catalog above (e.g., MC-ALG-001).
- Do not invent misconceptions not in the catalog.
- Confidence 0.8+ means highly confident, 0.5-0.8 moderate, below 0.5 weak possibility.
- Remediation advice should be concise, helpful, and addressed directly to the student.`;
}

// ---------------------------------------------------------------------------
// User prompt construction
// ---------------------------------------------------------------------------

function buildUserPrompt(
  studentResponse: string,
  context: DetectionContext,
): string {
  const parts: string[] = [];

  if (context.questionText) {
    parts.push(`السؤال: ${context.questionText}`);
  }
  if (context.expectedAnswer) {
    parts.push(`الإجابة الصحيحة المتوقعة: ${context.expectedAnswer}`);
  }
  if (context.lessonTopic) {
    parts.push(`موضوع الدرس: ${context.lessonTopic}`);
  }

  parts.push(`إجابة الطالب: ${studentResponse}`);

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Quick pattern-based pre-check (no AI call)
// ---------------------------------------------------------------------------

/**
 * Performs a fast regex/keyword pre-screening of the student's response
 * against the detection patterns defined in the misconception catalog.
 * No AI call is made — purely pattern matching.
 */
export function quickPatternCheck(studentResponse: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  for (const entry of MISCONCEPTION_CATALOG) {
    for (const pattern of entry.detectionPatterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(studentResponse)) {
          matches.push({ code: entry.code, pattern });
          // Only record first matching pattern per misconception
          break;
        }
      } catch {
        // If regex is invalid, try simple substring match
        if (studentResponse.includes(pattern)) {
          matches.push({ code: entry.code, pattern });
          break;
        }
      }
    }
  }

  return matches;
}

// ---------------------------------------------------------------------------
// AI-powered detection
// ---------------------------------------------------------------------------

/**
 * Analyzes a student's response for misconceptions using Claude AI.
 * Returns structured detection results with confidence scores and evidence.
 */
export async function detectMisconceptions(
  studentResponse: string,
  context: DetectionContext = {},
): Promise<DetectionResult> {
  const locale = context.locale ?? 'ar';

  const { object } = await generateObject({
    model: getAIModel(),
    schema: detectionResultSchema,
    system: buildSystemPrompt(locale),
    prompt: buildUserPrompt(studentResponse, context),
    maxOutputTokens: 2048,
  });

  // Validate that returned codes exist in our catalog
  const validCodes = new Set<string>(
    MISCONCEPTION_CATALOG.map((m: MisconceptionEntry) => m.code),
  );

  const validMisconceptions = object.misconceptions.filter((m) =>
    validCodes.has(m.code),
  );

  return {
    detected: validMisconceptions.length > 0,
    misconceptions: validMisconceptions,
  };
}
