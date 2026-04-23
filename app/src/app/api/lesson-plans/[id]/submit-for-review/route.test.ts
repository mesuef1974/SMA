/**
 * BL-028 — Tests for POST /api/lesson-plans/[id]/submit-for-review.
 *
 * Exercises the route handler directly with mocked auth/DAL/security
 * helpers. Covers: CSRF, rate limit, auth, UUID validation, ownership,
 * transition guard (draft | changes_requested → in_review), and
 * terminal-state conflicts.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

// --- Mocks (must be set up before importing the route) --------------------

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
  rateLimitResponse: (r: { reset: number }) =>
    new Response(JSON.stringify({ error: 'rate' }), {
      status: 429,
      headers: { 'Retry-After': String(r.reset) },
    }),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateOrigin: vi.fn(() => true),
  csrfForbiddenResponse: () =>
    new Response(JSON.stringify({ error: 'csrf' }), { status: 403 }),
}));
vi.mock('@/db/queries', () => ({
  getLessonPlanById: vi.fn(),
  updateLessonPlan: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { validateOrigin } from '@/lib/security/csrf';
import { getLessonPlanById, updateLessonPlan } from '@/db/queries';
import { POST } from './route';

// --- Helpers --------------------------------------------------------------

const TEACHER_ID = '10089cca-dab0-4416-898c-ff99ae68d397';
const OTHER_TEACHER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const PLAN_ID = '0b14a0f4-1234-4abc-9def-aabbccddeeff';

function makeReq(): Request {
  return new Request('https://sma.qa/api/lesson-plans/xxx/submit-for-review', {
    method: 'POST',
    headers: { Origin: 'https://sma.qa' },
  });
}

function ctx(id: string = PLAN_ID) {
  return { params: Promise.resolve({ id }) };
}

function okRate() {
  vi.mocked(rateLimit).mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
    reset: 0,
  });
}

function authedAs(userId: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: userId, email: 't@sma.qa', role: 'teacher' },
  } as unknown as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
}

// --- Tests ----------------------------------------------------------------

describe('POST /api/lesson-plans/[id]/submit-for-review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateOrigin).mockReturnValue(true);
    okRate();
  });

  test('rejects invalid Origin with 403 before any DB access', async () => {
    vi.mocked(validateOrigin).mockReturnValue(false);
    const res = await POST(makeReq(), ctx());
    expect(res.status).toBe(403);
    expect(vi.mocked(getLessonPlanById)).not.toHaveBeenCalled();
  });

  test('returns 429 when rate-limited', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 100,
      remaining: 0,
      reset: 30,
    });
    const res = await POST(makeReq(), ctx());
    expect(res.status).toBe(429);
  });

  test('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeReq(), ctx());
    expect(res.status).toBe(401);
  });

  test('returns 400 for a malformed plan id', async () => {
    authedAs(TEACHER_ID);
    const res = await POST(makeReq(), ctx('not-a-uuid'));
    expect(res.status).toBe(400);
    expect(vi.mocked(getLessonPlanById)).not.toHaveBeenCalled();
  });

  test('returns 404 when the plan does not exist', async () => {
    authedAs(TEACHER_ID);
    vi.mocked(getLessonPlanById).mockResolvedValue(null as never);
    const res = await POST(makeReq(), ctx());
    expect(res.status).toBe(404);
  });

  test('returns 403 when the caller does not own the plan', async () => {
    authedAs(TEACHER_ID);
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      teacherId: OTHER_TEACHER_ID,
      status: 'draft',
    } as never);
    const res = await POST(makeReq(), ctx());
    expect(res.status).toBe(403);
    expect(vi.mocked(updateLessonPlan)).not.toHaveBeenCalled();
  });

  test('transitions draft → in_review and returns 200', async () => {
    authedAs(TEACHER_ID);
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      teacherId: TEACHER_ID,
      status: 'draft',
    } as never);
    vi.mocked(updateLessonPlan).mockResolvedValue({} as never);

    const res = await POST(makeReq(), ctx());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, status: 'in_review' });
    expect(vi.mocked(updateLessonPlan)).toHaveBeenCalledWith(PLAN_ID, {
      status: 'in_review',
    });
  });

  test('transitions changes_requested → in_review (resubmission)', async () => {
    authedAs(TEACHER_ID);
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      teacherId: TEACHER_ID,
      status: 'changes_requested',
    } as never);
    vi.mocked(updateLessonPlan).mockResolvedValue({} as never);

    const res = await POST(makeReq(), ctx());
    expect(res.status).toBe(200);
    expect(vi.mocked(updateLessonPlan)).toHaveBeenCalledWith(PLAN_ID, {
      status: 'in_review',
    });
  });

  test.each([
    ['in_review'],
    ['approved'],
    ['rejected'],
    ['rejected_gate'],
    ['archived'],
  ])('returns 409 from terminal/in-flight state: %s', async (status) => {
    authedAs(TEACHER_ID);
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      teacherId: TEACHER_ID,
      status,
    } as never);
    const res = await POST(makeReq(), ctx());
    expect(res.status).toBe(409);
    expect(vi.mocked(updateLessonPlan)).not.toHaveBeenCalled();
  });

  test('treats null status as draft and allows submission', async () => {
    authedAs(TEACHER_ID);
    vi.mocked(getLessonPlanById).mockResolvedValue({
      id: PLAN_ID,
      teacherId: TEACHER_ID,
      status: null,
    } as never);
    vi.mocked(updateLessonPlan).mockResolvedValue({} as never);

    const res = await POST(makeReq(), ctx());
    expect(res.status).toBe(200);
  });

  test('returns 500 when DAL throws unexpectedly', async () => {
    authedAs(TEACHER_ID);
    vi.mocked(getLessonPlanById).mockRejectedValue(new Error('db down'));
    const res = await POST(makeReq(), ctx());
    expect(res.status).toBe(500);
  });
});
