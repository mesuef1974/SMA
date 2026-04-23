/**
 * POST /api/lesson-plans/[id]/advisor-decision
 *
 * Records an academic advisor's approval/rejection of a lesson plan's
 * Triple-Gate advisor review (DEC-SMA-037). Updates the advisor fields
 * inside sectionData.gate_results — no DB migration needed since
 * sectionData is jsonb.
 *
 * Input:  {
 *           decision: 'approved' | 'rejected' | 'request_changes',
 *           notes?: string,
 *           comment?: string,
 *           rubric_scores?: { scientific_accuracy, qncf_alignment,
 *                             pedagogical_flow, assessment_quality,
 *                             language_clarity } (each 1–5)
 *         }
 * Output: The updated lesson plan record (200) or error
 *
 * P1.3 (2026-04-21): every decision also appends an append-only row to
 * `lesson_plan_reviews` for audit/history.
 *
 * Authorization:
 *   - session.user.role === 'advisor', OR
 *   - session.user.role === 'admin'
 */

import { z } from 'zod';

import { auth } from '@/lib/auth';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateOrigin, csrfForbiddenResponse } from '@/lib/security/csrf';
import {
  getLessonPlanById,
  updateLessonPlan,
  createLessonPlanReview,
} from '@/db/queries';
import { isAdvisor, type AdvisorDecision } from '@/lib/advisor';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// DEC-SMA-037 P1.2 — rubric scores (1-5 per criterion).
const rubricScoresSchema = z.object({
  scientific_accuracy: z.number().int().min(1).max(5),
  qncf_alignment: z.number().int().min(1).max(5),
  pedagogical_flow: z.number().int().min(1).max(5),
  assessment_quality: z.number().int().min(1).max(5),
  language_clarity: z.number().int().min(1).max(5),
});

const requestSchema = z.object({
  // 'request_changes' will be wired end-to-end in P1.3; for now, it is
  // normalized to 'rejected' below so existing gate semantics hold.
  decision: z.enum(['approved', 'rejected', 'request_changes']),
  notes: z.string().max(2000).optional(),
  rubric_scores: rubricScoresSchema.optional(),
  comment: z.string().max(4000).optional(),
});

interface ErrorResponse {
  error: string;
}

function errorJson(message: string, status: number): Response {
  return Response.json({ error: message } satisfies ErrorResponse, { status });
}

type SectionDataObject = Record<string, unknown>;

interface RubricScoresLoose {
  scientific_accuracy: number;
  qncf_alignment: number;
  pedagogical_flow: number;
  assessment_quality: number;
  language_clarity: number;
}

interface GateResultsLoose {
  bloom_gate?: 'pass' | 'fail';
  qncf_gate?: 'pass' | 'fail';
  advisor_gate?: 'pending' | 'approved' | 'needs_revision';
  failure_reasons?: string[];
  advisor_reviewed_at?: string;
  advisor_reviewer_id?: string;
  /**
   * @deprecated P1.3 cleanup (2026-04-23) — writes go to `advisor_comment`
   * instead. Existing rows retain this field untouched; readers should
   * prefer `advisor_comment ?? advisor_notes` for backward compatibility.
   */
  advisor_notes?: string;
  advisor_rubric_scores?: RubricScoresLoose;
  advisor_comment?: string;
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

    const { decision, notes, rubric_scores, comment } = parsed.data;

    // P1.3 — 'request_changes' (API) maps to enum value 'changes_requested'
    // in the DB. Approve/reject keep their existing semantics. The resulting
    // value conforms to the shared `AdvisorDecision` union.
    const historyDecision: AdvisorDecision =
      decision === 'approved'
        ? 'approved'
        : decision === 'request_changes'
          ? 'changes_requested'
          : 'rejected';

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

    // P1.3 cleanup (2026-04-23): `advisor_comment` is the canonical field.
    // We no longer write `advisor_notes` — if the client still sends `notes`
    // (older UI builds), it is folded into `advisor_comment` so nothing is
    // lost. Existing rows with `advisor_notes` are untouched; readers should
    // fall back to `advisor_notes` when `advisor_comment` is absent.
    const canonicalComment =
      comment ?? notes ?? existingGate.advisor_comment;
    const nextGate: GateResultsLoose = {
      ...existingGate,
      advisor_gate:
        historyDecision === 'approved' ? 'approved' : 'needs_revision',
      advisor_reviewed_at: new Date().toISOString(),
      advisor_reviewer_id: session.user.id,
      advisor_rubric_scores: rubric_scores ?? existingGate.advisor_rubric_scores,
      advisor_comment: canonicalComment,
    };

    sd.gate_results = nextGate;

    // Promote the lesson_plans.status column. Transitions (P1.3):
    //   approved          → advisor approved AND auto-gates pass
    //   changes_requested → advisor asked the teacher to revise
    //   in_review         → advisor rejected (stays in advisor queue) or
    //                       approve blocked by auto-gate failure
    const gatesPass =
      nextGate.bloom_gate !== 'fail' && nextGate.qncf_gate !== 'fail';
    const nextStatus: 'approved' | 'in_review' | 'changes_requested' =
      historyDecision === 'approved' && gatesPass
        ? 'approved'
        : historyDecision === 'changes_requested'
          ? 'changes_requested'
          : 'in_review';

    const updated = await updateLessonPlan(id, {
      sectionData: sd,
      status: nextStatus,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      humanReviewed: true,
    });

    // P1.3 — append an immutable history row for every decision. Failure
    // is logged but does not fail the request, since the plan mutation
    // already succeeded and a retry would duplicate it.
    try {
      await createLessonPlanReview({
        lessonPlanId: id,
        reviewerId: session.user.id,
        decision: historyDecision,
        comment: comment ?? notes ?? null,
        rubricScores: rubric_scores ?? null,
      });
    } catch (historyErr) {
      console.error(
        '[/api/lesson-plans/[id]/advisor-decision] failed to append review history:',
        historyErr,
      );
    }

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error('[/api/lesson-plans/[id]/advisor-decision] Error:', error);
    return errorJson('حدث خطأ غير متوقع أثناء تسجيل قرار المراجعة', 500);
  }
}
