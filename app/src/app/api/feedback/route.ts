/**
 * Feedback / Support API Endpoint — S4-10
 *
 * POST /api/feedback
 * Accepts feedback from authenticated teachers (NextAuth session) or
 * students (studentId cookie). Rate-limited to prevent abuse.
 *
 * MVP: logs feedback to console. No DB or email integration yet.
 */

import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { validateOrigin, csrfForbiddenResponse } from '@/lib/security/csrf';
import { sanitizeText } from '@/lib/security/sanitize';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// Allowed feedback types
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = ['bug', 'suggestion', 'question'] as const;
type FeedbackType = (typeof ALLOWED_TYPES)[number];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface FeedbackBody {
  name: string;
  message: string;
  type: FeedbackType;
}

function validateBody(
  body: unknown,
): { ok: true; data: FeedbackBody } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'البيانات المرسلة غير صالحة' };
  }

  const { name, message, type } = body as Record<string, unknown>;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return { ok: false, error: 'الاسم مطلوب' };
  }
  if (name.trim().length > 100) {
    return { ok: false, error: 'الاسم يجب ألا يتجاوز ١٠٠ حرف' };
  }

  if (typeof type !== 'string' || !ALLOWED_TYPES.includes(type as FeedbackType)) {
    return { ok: false, error: 'نوع الرسالة غير صالح' };
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { ok: false, error: 'الرسالة مطلوبة' };
  }
  if (message.trim().length > 2000) {
    return { ok: false, error: 'الرسالة يجب ألا تتجاوز ٢٠٠٠ حرف' };
  }

  return {
    ok: true,
    data: {
      name: sanitizeText(name, 100),
      message: sanitizeText(message, 2000),
      type: type as FeedbackType,
    },
  };
}

// ---------------------------------------------------------------------------
// POST /api/feedback
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  // --- CSRF Protection ---
  if (!validateOrigin(req)) return csrfForbiddenResponse();

  // --- Rate Limiting ---
  const rl = await rateLimit(req);
  if (!rl.success) return rateLimitResponse(rl);

  // --- Authentication: teacher session OR student cookie ---
  const session = await auth();
  const cookieStore = await cookies();
  const studentId = cookieStore.get('studentId')?.value;

  if (!session?.user?.id && !studentId) {
    return Response.json(
      { error: 'غير مصرح — يرجى تسجيل الدخول أو الانضمام إلى صف أولاً' },
      { status: 401 },
    );
  }

  try {
    const body: unknown = await req.json();
    const validation = validateBody(body);

    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const { name, message, type } = validation.data;

    // MVP: log to console (no DB/email storage yet)
    const sender = session?.user?.id
      ? `teacher:${session.user.id}`
      : `student:${studentId}`;

    console.info('[feedback]', {
      sender,
      name,
      type,
      message,
      timestamp: new Date().toISOString(),
    });

    return Response.json(
      { success: true, message: 'تم إرسال ملاحظتك بنجاح. شكراً لك!' },
      { status: 200 },
    );
  } catch (error) {
    console.error('[POST /api/feedback] Error:', error);
    return Response.json(
      { error: 'حدث خطأ أثناء إرسال الملاحظة. حاول مرة أخرى.' },
      { status: 500 },
    );
  }
}
