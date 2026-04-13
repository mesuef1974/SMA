export const runtime = 'edge';

import { classifyOutcomes, type OutcomeAnalysis } from '@/lib/bloom-classifier';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestBody {
  outcomes: { id: string; text: string }[];
  locale?: 'ar' | 'en';
}

interface SuccessResponse {
  results: Record<string, OutcomeAnalysis>;
}

interface ErrorResponse {
  error: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateRequest(body: unknown): {
  ok: true;
  data: RequestBody;
} | {
  ok: false;
  error: string;
} {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'الطلب غير صالح — يجب أن يكون كائن JSON' };
  }

  const { outcomes, locale } = body as Record<string, unknown>;

  if (!Array.isArray(outcomes)) {
    return { ok: false, error: 'الحقل "outcomes" مطلوب ويجب أن يكون مصفوفة' };
  }

  if (outcomes.length === 0) {
    return { ok: false, error: 'يجب تقديم نتاج تعلّم واحد على الأقل' };
  }

  if (outcomes.length > 10) {
    return {
      ok: false,
      error: 'لا يمكن معالجة أكثر من 10 نتاجات في المرة الواحدة',
    };
  }

  for (let i = 0; i < outcomes.length; i++) {
    const item = outcomes[i];
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as Record<string, unknown>).id !== 'string' ||
      typeof (item as Record<string, unknown>).text !== 'string'
    ) {
      return {
        ok: false,
        error: `العنصر رقم ${i + 1} غير صالح — يجب أن يحتوي على "id" و "text" كنصوص`,
      };
    }

    if ((item as { text: string }).text.trim().length === 0) {
      return {
        ok: false,
        error: `العنصر رقم ${i + 1} يحتوي على نص فارغ`,
      };
    }
  }

  if (locale !== undefined && locale !== 'ar' && locale !== 'en') {
    return { ok: false, error: 'الحقل "locale" يجب أن يكون "ar" أو "en"' };
  }

  return {
    ok: true,
    data: {
      outcomes: outcomes as { id: string; text: string }[],
      locale: (locale as 'ar' | 'en') ?? 'ar',
    },
  };
}

// ---------------------------------------------------------------------------
// POST /api/bloom
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  // --- Rate Limiting ---
  const rl = await rateLimit(req);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body: unknown = await req.json();
    const validation = validateRequest(body);

    if (!validation.ok) {
      return Response.json(
        { error: validation.error } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    const { outcomes, locale } = validation.data;

    const resultsMap = await classifyOutcomes(outcomes, { locale });

    // Convert Map to plain object for JSON serialization
    const results: Record<string, OutcomeAnalysis> = {};
    for (const [id, analysis] of resultsMap) {
      results[id] = analysis;
    }

    return Response.json({ results } satisfies SuccessResponse, {
      status: 200,
    });
  } catch (error) {
    console.error('[/api/bloom] Error:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'حدث خطأ غير متوقع أثناء معالجة الطلب';

    return Response.json({ error: message } satisfies ErrorResponse, {
      status: 500,
    });
  }
}
