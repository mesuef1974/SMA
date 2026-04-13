export const runtime = 'edge';

import { z } from 'zod';

import {
  detectMisconceptions,
  type DetectionResult,
} from '@/lib/misconceptions';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorResponse {
  error: string;
}

// ---------------------------------------------------------------------------
// Request validation with Zod
// ---------------------------------------------------------------------------

const requestSchema = z.object({
  response: z
    .string()
    .min(1, 'الحقل "response" مطلوب ولا يمكن أن يكون فارغاً'),
  context: z
    .object({
      lessonTopic: z.string().optional(),
      questionText: z.string().optional(),
      expectedAnswer: z.string().optional(),
    })
    .optional(),
  locale: z.enum(['ar', 'en']).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/misconceptions/detect
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  // --- Rate Limiting ---
  const rl = await rateLimit(req);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body: unknown = await req.json();

    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      const message = firstError?.message ?? 'الطلب غير صالح';

      return Response.json(
        { error: message } satisfies ErrorResponse,
        { status: 400 },
      );
    }

    const { response: studentResponse, context, locale } = parsed.data;

    const result: DetectionResult = await detectMisconceptions(
      studentResponse,
      {
        lessonTopic: context?.lessonTopic,
        questionText: context?.questionText,
        expectedAnswer: context?.expectedAnswer,
        locale: locale ?? 'ar',
      },
    );

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error('[/api/misconceptions] Error:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'حدث خطأ غير متوقع أثناء تحليل إجابة الطالب';

    return Response.json(
      { error: message } satisfies ErrorResponse,
      { status: 500 },
    );
  }
}
