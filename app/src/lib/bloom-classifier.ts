import { getAIModel } from '@/lib/ai/provider';
import { generateObject } from 'ai';

import { z } from 'zod';

import { buildBloomPromptReference, type BloomLevel } from '@/lib/bloom-keywords';
import { buildQNCFPromptReference } from '@/lib/qncf-standards';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BloomClassification {
  level: BloomLevel;
  confidence: number;
  reasoning: string;
  keywords: string[];
}

export interface QNCFMapping {
  standard: string;
  domain: string;
  subdomain: string;
  confidence: number;
}

export interface OutcomeAnalysis {
  bloom: BloomClassification;
  qncf: QNCFMapping;
  suggestedActivities: string[];
}

// ---------------------------------------------------------------------------
// Zod schemas for structured output
// ---------------------------------------------------------------------------

const bloomClassificationSchema = z.object({
  level: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  keywords: z.array(z.string()),
});

const qncfMappingSchema = z.object({
  standard: z.string(),
  domain: z.string(),
  subdomain: z.string(),
  confidence: z.number().min(0).max(1),
});

const outcomeAnalysisSchema = z.object({
  bloom: bloomClassificationSchema,
  qncf: qncfMappingSchema,
  // NOTE: .min(3).max(3) removed — Claude Structured Output API rejects
  // minItems > 1. Validation enforced by Zod post-generation.
  suggestedActivities: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------



function buildSystemPrompt(locale: 'ar' | 'en'): string {
  const bloomRef = buildBloomPromptReference();
  const qncfRef = buildQNCFPromptReference();

  if (locale === 'ar') {
    return `أنت خبير تربوي متخصص في تصنيف نتاجات التعلم وفقًا لتصنيف بلوم المُعدّل ومعايير الإطار الوطني لمناهج قطر (QNCF).

السياق: منهج الرياضيات للصف الحادي عشر — المسار الأدبي — دولة قطر.

## مستويات بلوم والأفعال المرتبطة بها:
${bloomRef}

## معايير الإطار الوطني لمناهج قطر (QNCF) — رياضيات الصف 11 أدبي:
${qncfRef}

## التعليمات:
1. حلّل نص نتاج التعلم المُعطى.
2. حدّد مستوى بلوم بناءً على الفعل الرئيسي والعمليات المعرفية المطلوبة.
3. استخرج الكلمات المفتاحية (الأفعال) التي ساعدت في التصنيف.
4. طابق النتاج مع معيار QNCF الأنسب من القائمة أعلاه.
5. اقترح 3 أنشطة تعليمية مناسبة لمستوى بلوم المحدّد (باللغة العربية).
6. قدّم درجة ثقة (0.0 إلى 1.0) لكل من تصنيف بلوم ومطابقة QNCF.

## ملاحظات مهمة:
- إذا كان نص النتاج باللغة العربية، استخرج الكلمات المفتاحية بالعربية.
- إذا كان النص بالإنجليزية، استخرج الكلمات المفتاحية بالإنجليزية.
- الأنشطة المقترحة يجب أن تكون عملية وقابلة للتطبيق في سياق الصف 11 أدبي.
- إذا لم يتطابق النتاج تمامًا مع أي معيار QNCF، اختر الأقرب واخفض درجة الثقة.`;
  }

  return `You are an educational expert specializing in classifying learning outcomes using the revised Bloom's Taxonomy and mapping them to Qatar National Curriculum Framework (QNCF) standards.

Context: Grade 11 Mathematics — Literary Track — State of Qatar.

## Bloom Levels and Associated Verbs:
${bloomRef}

## QNCF Standards — Grade 11 Literary Math:
${qncfRef}

## Instructions:
1. Analyze the given learning outcome text.
2. Determine the Bloom level based on the main verb and required cognitive processes.
3. Extract keywords (verbs) that helped in classification.
4. Map the outcome to the most appropriate QNCF standard from the list above.
5. Suggest 3 learning activities appropriate for the identified Bloom level (in Arabic).
6. Provide a confidence score (0.0 to 1.0) for both the Bloom classification and QNCF mapping.

## Important Notes:
- If the outcome text is in Arabic, extract keywords in Arabic.
- If the text is in English, extract keywords in English.
- Suggested activities must be practical and applicable in the Grade 11 Literary context.
- If the outcome does not exactly match any QNCF standard, choose the closest one and lower the confidence score.`;
}

// ---------------------------------------------------------------------------
// Main classification function
// ---------------------------------------------------------------------------

/**
 * Classifies a single learning outcome into a Bloom level and maps it
 * to a QNCF standard using Claude AI with structured output.
 */
export async function classifyOutcome(
  outcomeText: string,
  options?: { locale?: 'ar' | 'en' }
): Promise<OutcomeAnalysis> {
  const locale = options?.locale ?? 'ar';

  const { object } = await generateObject({
    model: getAIModel(),
    schema: outcomeAnalysisSchema,
    system: buildSystemPrompt(locale),
    prompt: outcomeText,
    maxOutputTokens: 1024,
  });

  return object;
}

// ---------------------------------------------------------------------------
// Batch classification function
// ---------------------------------------------------------------------------

/**
 * Classifies multiple learning outcomes in a single batch.
 * Processes outcomes concurrently for efficiency.
 * Throws if the input array exceeds 10 items.
 */
export async function classifyOutcomes(
  outcomes: { id: string; text: string }[],
  options?: { locale?: 'ar' | 'en' }
): Promise<Map<string, OutcomeAnalysis>> {
  if (outcomes.length === 0) {
    return new Map();
  }

  if (outcomes.length > 10) {
    throw new Error(
      options?.locale === 'en'
        ? 'Cannot process more than 10 outcomes at once. Please split into smaller batches.'
        : 'لا يمكن معالجة أكثر من 10 نتاجات في المرة الواحدة. يرجى تقسيمها إلى دفعات أصغر.'
    );
  }

  const results = await Promise.all(
    outcomes.map(async (outcome) => {
      const analysis = await classifyOutcome(outcome.text, options);
      return [outcome.id, analysis] as const;
    })
  );

  return new Map(results);
}
