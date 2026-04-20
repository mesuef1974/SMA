/**
 * POST /api/lesson-plans/[id]/advisor-decision
 *
 * Records an academic advisor's approval/rejection of a lesson plan's
 * Triple-Gate advisor review (DEC-SMA-037). Updates the advisor fields
 * inside sectionData.gate_results — no DB migration needed since
 * sectionData is jsonb.
 *
 * Input:  { decision: 'approved' | 'rejected', notes?: string }
 * Output: The updated lesson plan record (200) or error
 *
 * Authorization:
 *   - session.user.role === 'advisor', OR
 *   - session.user.role === 'admin'
 */

import { z } from 'zod';

import { auth } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateOrigin, csrfForbiddenResponse } from '@/lib/security/csrf';
import { getLessonPlanById, updateLessonPlan } from '@/db/queries';
import { isAdvisor } from '@/lib/advisor';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const requestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().max(2000).optional(),
});

interface ErrorResponse {
  error: string;
}

function errorJson(message: string, status: number): Response {
  return Response.json({ error: message } satisfies ErrorResponse, { status });
}

type SectionDataObject = Record<string, unknown>;

interface GateResultsLoose {
  bloom_gate?: 'pass' | 'fail';
  qncf_gate?: 'pass' | 'fail';
  advisor_gate?: 'pending' | 'approved' | 'needs_revision';
  failure_reasons?: string[];
  advisor_reviewed_at?: string;
  advisor_reviewer_id?: string;
  advisor_notes?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
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

  // --- Advisor authorization ---
  if (!isAdvisor(session)) {
    return errorJson('غير مصرّح — هذا الإجراء متاح للمستشارين الأكاديميين فقط', 403);
  }

  // --- Validate the id param ---
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return errorJson('معرّف الخطة غير صالح', 400);
  }

  try {
    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return errorJson(firstError?.message ?? 'الطلب غير صالح', 400);
    }

    const { decision, notes } = parsed.data;

    const plan = await getLessonPlanById(id);
    if (!plan) {
      return errorJson('الخطة غير موجودة', 404);
    }

    // Build the next sectionData. `sectionData` is jsonb — treat as loose object.
    const sd: SectionDataObject =
      plan.sectionData && typeof plan.sectionData === 'object' && !Array.isArray(plan.sectionData)
        ? { ...(plan.sectionData as SectionDataObject) }
        : {};

    const existingGate: GateResultsLoose =
      sd.gate_results && typeof sd.gate_results === 'object' && !Array.isArray(sd.gate_results)
        ? { ...(sd.gate_results as GateResultsLoose) }
        : {};

    const nextGate: GateResultsLoose = {
      ...existingGate,
      advisor_gate: decision === 'approved' ? 'approved' : 'needs_revision',
      advisor_reviewed_at: new Date().toISOString(),
      advisor_reviewer_id: session.user.id,
      advisor_notes: notes,
    };

    sd.gate_results = nextGate;

    // Promote the lesson_plans.status column to 'approved' only when the
    // advisor approves AND the gate as a whole passes. For rejection, fall
    // back to 'in_review' so it still shows up in the advisor queue.
    const gatesPass =
      nextGate.bloom_gate !== 'fail' && nextGate.qncf_gate !== 'fail';
    const nextStatus: 'approved' | 'in_review' =
      decision === 'approved' && gatesPass ? 'approved' : 'in_review';

    const updated = await updateLessonPlan(id, {
      sectionData: sd,
      status: nextStatus,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      humanReviewed: true,
    });

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error('[/api/lesson-plans/[id]/advisor-decision] Error:', error);
    return errorJson('حدث خطأ غير متوقع أثناء تسجيل قرار المراجعة', 500);
  }
}
