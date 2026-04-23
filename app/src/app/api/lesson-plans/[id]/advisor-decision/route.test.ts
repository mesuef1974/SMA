/**
 * BL-028 — Tests for POST /api/lesson-plans/[id]/advisor-decision.
 *
 * Covers the advisor half of the submit-for-review loop: decision
 * validation, status transitions (approved ↔ gate outcome,
 * changes_requested, rejected → in_review), and the append-only
 * history row in `lesson_plan_reviews`.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  rateLimitResponse: () =>
    new Response(JSON.stringify({ error: 'rate' }), { status: 429 }),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateOrigin: vi.fn(() => true),
  csrfForbiddenResponse: () =>
    new Response(JSON.stringify({ error: 'csrf' }), { status: 403 }),
}));
vi.mock('@/lib/advisor', () => ({
  isAdvisor: vi.fn(),
}));
vi.mock('@/db/queries', () => ({
  getLessonPlanById: vi.fn(),
  updateLessonPlan: vi.fn(),
  createLessonPlanReview: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { isAdvisor } from '@/lib/advisor';
import {
  getLessonPlanById,
  updateLessonPlan,
  createLessonPlanReview,
} from '@/db/queries';
import { POST } from './route';

const ADVISOR_ID = 'cccccccc-dddd-eeee-ffff-111111111111';
const PLAN_ID = '0b14a0f4-1234-4abc-9def-aabbccddeeff';

function makeReq(body: unknown): Request {
  return new Request(
    'https://sma.qa/api/lesson-plans/xxx/advisor-decision',
    {
      method: 'POST',
      headers: {
        Origin: 'https://sma.qa',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
}

function ctx(id: string = PLAN_ID) {
  return { params: Promise.resolve({ id }) };
}

function authedAsAdvisor() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: ADVISOR_ID, email: 'advisor@sma.qa', role: 'advisor' },
  } as never);
  vi.mocked(isAdvisor).mockReturnValue(true);
}

const VALID_RUBRIC = {
  scientific_accuracy: 4,
  qncf_alignment: 5,
  pedagogical_flow: 4,
  assessment_quality: 3,
  language_clarity: 5,
};

describe('POST /api/lesson-plans/[id]/advisor-decision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: 0,
    });
    vi.mocked(updateLessonPlan).mockResolvedValue({ id: PLAN_ID } as never);
    vi.mocked(createLessonPlanReview).mockResolvedValue({} as never);
  });

  test('returns 403 when caller is not an advisor', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'teacher', role: 'teacher' },
    } as never);
    vi.mocked(isAdvisor).mockReturnValue(false);
    const res = await POST(makeReq({ decision: 'approved' }), ctx());
    expect(res.status).toBe(403);
    expect(vi.mocked(updateLessonPlan)).not.toHaveBeenCalled();
  });

  test('returns 400 for an unknown decision value', async () => {
    authedAsAdvisor();
    const res = await POST(makeReq({ decision: 'maybe' }), ctx());
    expect(res.status).toBe(400);
  });

  test('returns 400 when rubric scores are out of range', async () => {
    authedAsAdvisor();
    const res = await POST(
      makeReq({
        decision: 'request_changes',
        rubric_scores: { ...VALID_RUBRIC, scientific_accuracy: 9 },
      }),
      ctx(),
    );
    expect(res.status).toBe(400);
  });

  test('approved + passing gates → status=approved and history row written', async () => {
    authedAsAdvisor();
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      sectionData: { gate_results: { bloom_gate: 'pass', qncf_gate: 'pass' } },
    } as never);

    const res = await POST(
      makeReq({ decision: 'approved', comment: 'Looks great.' }),
      ctx(),
    );
    expect(res.status).toBe(200);

    const [, patch] = vi.mocked(updateLessonPlan).mock.calls[0]!;
    expect(patch.status).toBe('approved');
    expect(patch.reviewedBy).toBe(ADVISOR_ID);
    expect(patch.humanReviewed).toBe(true);

    expect(vi.mocked(createLessonPlanReview)).toHaveBeenCalledWith(
      expect.objectContaining({
        lessonPlanId: PLAN_ID,
        reviewerId: ADVISOR_ID,
        decision: 'approved',
        comment: 'Looks great.',
      }),
    );
  });

  test('approved but auto-gate failed → stays in_review (does not skip the gate)', async () => {
    authedAsAdvisor();
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      sectionData: { gate_results: { bloom_gate: 'fail', qncf_gate: 'pass' } },
    } as never);

    const res = await POST(makeReq({ decision: 'approved' }), ctx());
    expect(res.status).toBe(200);
    const [, patch] = vi.mocked(updateLessonPlan).mock.calls[0]!;
    expect(patch.status).toBe('in_review');
  });

  test('request_changes → status=changes_requested and history=changes_requested', async () => {
    authedAsAdvisor();
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      sectionData: {},
    } as never);

    const res = await POST(
      makeReq({
        decision: 'request_changes',
        comment: 'أعد صياغة نتائج التعلّم.',
        rubric_scores: VALID_RUBRIC,
      }),
      ctx(),
    );
    expect(res.status).toBe(200);

    const [, patch] = vi.mocked(updateLessonPlan).mock.calls[0]!;
    expect(patch.status).toBe('changes_requested');

    expect(vi.mocked(createLessonPlanReview)).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'changes_requested',
        rubricScores: VALID_RUBRIC,
      }),
    );
  });

  test('rejected → status=in_review (plan stays in advisor queue)', async () => {
    authedAsAdvisor();
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      sectionData: {},
    } as never);

    const res = await POST(makeReq({ decision: 'rejected' }), ctx());
    expect(res.status).toBe(200);
    const [, patch] = vi.mocked(updateLessonPlan).mock.calls[0]!;
    expect(patch.status).toBe('in_review');

    expect(vi.mocked(createLessonPlanReview)).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'rejected' }),
    );
  });

  test('writes advisor_comment (canonical) — no longer writes advisor_notes', async () => {
    authedAsAdvisor();
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      sectionData: {},
    } as never);

    await POST(
      makeReq({ decision: 'approved', notes: 'fallback from old UI' }),
      ctx(),
    );
    const [, patch] = vi.mocked(updateLessonPlan).mock.calls[0]!;
    const gate = (patch.sectionData as { gate_results: Record<string, unknown> })
      .gate_results;
    expect(gate.advisor_comment).toBe('fallback from old UI');
    expect(gate.advisor_notes).toBeUndefined();
  });

  test('succeeds with 200 even when history-log insert throws', async () => {
    authedAsAdvisor();
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      sectionData: {},
    } as never);
    vi.mocked(createLessonPlanReview).mockRejectedValue(new Error('audit down'));

    // Silence the expected console.error so test output stays clean.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(makeReq({ decision: 'approved' }), ctx());
    spy.mockRestore();

    expect(res.status).toBe(200);
    expect(vi.mocked(updateLessonPlan)).toHaveBeenCalled();
  });

  test('returns 404 when plan does not exist', async () => {
    authedAsAdvisor();
    vi.mocked(getLessonPlanById).mockResolvedValue(null as never);
    const res = await POST(makeReq({ decision: 'approved' }), ctx());
    expect(res.status).toBe(404);
  });
});
