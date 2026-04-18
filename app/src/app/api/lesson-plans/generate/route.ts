/**
 * POST /api/lesson-plans/generate
 *
 * Generates a full lesson plan using Claude AI, validates it against the
 * Zod schema, and persists it to the database.
 *
 * Input:  { lessonId: string, periodNumber: 1 | 2 }
 * Output: The created lesson plan record (with sectionData populated).
 *
 * Requires authentication (enforced by proxy.ts middleware).
 * Rate limited via the shared rate-limit utility.
 */

import { z } from 'zod';
import { generateObject } from 'ai';

import { auth } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateOrigin, csrfForbiddenResponse } from '@/lib/security/csrf';
import { isAIConfigured, getAIModel } from '@/lib/ai/provider';
import { lessonPlanSchema } from '@/lib/lesson-plans/schema';
import { buildSystemPrompt } from '@/lib/lesson-plans/prompt';
import type { LessonContext } from '@/lib/lesson-plans/prompt';
import { getLessonById, getMisconceptionStats, createLessonPlan } from '@/db/queries';

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

const requestSchema = z.object({
  lessonId: z.string().uuid('lessonId يجب أن يكون UUID صالح'),
  periodNumber: z.union([z.literal(1), z.literal(2)], {
    message: 'periodNumber يجب أن يكون 1 أو 2',
  }),
  teacherNotes: z
    .string()
    .max(1000, 'ملاحظات المعلم يجب ألا تتجاوز 1000 حرف')
    .optional(),
});

// ---------------------------------------------------------------------------
// Error response helpers
// ---------------------------------------------------------------------------

interface ErrorResponse {
  error: string;
}

function errorJson(message: string, status: number): Response {
  return Response.json({ error: message } satisfies ErrorResponse, { status });
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  // --- CSRF Protection ---
  if (!validateOrigin(req)) return csrfForbiddenResponse();

  // --- Rate Limiting ---
  const rl = await rateLimit(req);
  if (!rl.success) return rateLimitResponse(rl);

  // --- Authentication ---
  const session = await auth();
  if (!session?.user?.id) {
    return errorJson('غير مصرّح — يرجى تسجيل الدخول', 401);
  }

  // --- AI availability check ---
  if (!isAIConfigured()) {
    return errorJson(
      'خدمة الذكاء الاصطناعي غير مُهيّأة. يرجى التواصل مع مدير النظام.',
      503,
    );
  }

  try {
    // --- Parse & validate request body ---
    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return errorJson(firstError?.message ?? 'الطلب غير صالح', 400);
    }

    const { lessonId, periodNumber, teacherNotes } = parsed.data;

    // --- Fetch lesson from DB ---
    const lesson = await getLessonById(lessonId);

    if (!lesson) {
      return errorJson('الدرس غير موجود', 404);
    }

    // --- Fetch misconception stats for this lesson ---
    const misconceptionData = await getMisconceptionStats(lessonId);

    // --- Build context for the system prompt ---
    const teacherGuidePages =
      lesson.pageStartTe && lesson.pageEndTe
        ? `${lesson.pageStartTe}-${lesson.pageEndTe}`
        : undefined;

    const studentBookPages =
      lesson.pageStartSe && lesson.pageEndSe
        ? `${lesson.pageStartSe}-${lesson.pageEndSe}`
        : undefined;

    const context: LessonContext = {
      lessonTitleAr: lesson.titleAr,
      lessonTitleEn: lesson.title,
      chapterNumber: lesson.chapter?.number ?? 0,
      chapterTitleAr: lesson.chapter?.titleAr ?? '',
      periodNumber: periodNumber as 1 | 2,
      teacherGuidePages,
      studentBookPages,
      learningOutcomes: (lesson.learningOutcomes ?? []).map((lo) => ({
        descriptionAr: lo.descriptionAr,
        bloomLevel: lo.bloomLevel,
      })),
      misconceptions: misconceptionData.map((m) => ({
        nameAr: m.nameAr,
        descriptionAr: null,
        remediationHintAr: null,
      })),
      teacherNotes,
    };

    // --- Call Claude AI ---
    const systemPrompt = buildSystemPrompt(context);

    const result = await generateObject({
      model: getAIModel(),
      schema: lessonPlanSchema,
      // Pass system as an array so we can attach providerOptions for Anthropic
      // prompt caching. The large system prompt (misconception catalog + few-shot
      // example) stays stable across requests — cache_control: ephemeral keeps it
      // in the 5-minute Anthropic cache, cutting input-token cost by ~90%.
      system: [
        {
          role: 'system' as const,
          content: systemPrompt,
          providerOptions: {
            anthropic: { cacheControl: { type: 'ephemeral' } },
          },
        },
      ],
      prompt: `أنشئ تحضير الحصة ${periodNumber} لدرس "${lesson.titleAr}" من الفصل ${lesson.chapter?.number ?? ''} (${lesson.chapter?.titleAr ?? ''}). التزم بالتوقيتات المحددة والمخرجات التعليمية.`,
      maxOutputTokens: 8000,
    });

    const sectionData = result.object;

    // --- Sanity check: ensure generated plan is for the right unit ---
    if (sectionData.header.unit_number !== (lesson.chapter?.number ?? 0)) {
      console.error(
        `[lesson-plans/generate] Unit mismatch: expected ${lesson.chapter?.number}, got ${sectionData.header.unit_number}`,
      );
      return errorJson(
        'الذكاء الاصطناعي أنتج تحضيراً لوحدة خاطئة. يرجى إعادة المحاولة أو استخدام القالب الجاهز.',
        502,
      );
    }

    // --- Persist to DB ---
    const plan = await createLessonPlan({
      lessonId,
      teacherId: session.user.id,
      periodNumber,
      status: 'draft',
      sectionData,
      aiSuggestions: {
        model: 'claude-sonnet-4-6',
        generatedAt: new Date().toISOString(),
        usage: result.usage,
      },
    });

    return Response.json(plan, { status: 201 });
  } catch (error) {
    console.error('[/api/lesson-plans/generate] Error:', error);

    // Surface Zod validation errors clearly
    if (error instanceof z.ZodError) {
      return errorJson(
        `خطأ في بنية الرد من الذكاء الاصطناعي: ${error.issues[0]?.message ?? 'بنية غير صالحة'}`,
        502,
      );
    }

    if (error instanceof Error) {
      console.error('[lesson-plans/generate]', error.message);
    }

    return errorJson('حدث خطأ غير متوقع أثناء توليد التحضير', 500);
  }
}
