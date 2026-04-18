/**
 * Triple-Gate Validator (D-34)
 *
 * Runs three independent gates on a generated lesson plan:
 *
 *   Gate 1 — Bloom    : every learning outcome / practice item / assess item
 *                       must declare a `bloom_level`.
 *   Gate 2 — QNCF     : every outcome / practice item / assess item, plus
 *                       warm_up / explore / explain / extend sections, must
 *                       declare a valid `qncf_code`. Optionally checked
 *                       against an authoritative QNCF catalog (TODO: wire
 *                       once `qncf-catalog.ts` lands).
 *   Gate 3 — Advisor  : human review status. Defaults to `pending`.
 *
 * Returns a structured result usable both for storage (`gate_results`) and
 * for surfacing failures to the teacher / advisor UI.
 */

import type { GateResults, LessonPlanData } from './schema';

export interface TripleGateOutcome {
  passed: boolean;
  results: GateResults;
  failure_reasons: string[];
}

const QNCF_CODE_RE = /^QNCF-G11-M-[A-Z]{3}-\d{3}$/;

// TODO: Replace this stub with a real lookup once
// `src/lib/lesson-plans/qncf-catalog.ts` (or DB-backed equivalent) exists.
function isKnownQncfCode(_code: string): boolean {
  return true;
}

/**
 * Validates a lesson plan against all three gates.
 * `plan` is permissive (`Partial<...>`-shaped) because the gate may run on
 * data that hasn't yet passed full Zod validation — we want to surface
 * structural omissions rather than throw.
 */
export function validateTripleGate(plan: LessonPlanData): TripleGateOutcome {
  const failure_reasons: string[] = [];

  // ---------- Gate 1: Bloom ----------
  let bloomPass = true;

  const outcomes = plan.learning_outcomes ?? [];
  outcomes.forEach((o, i) => {
    if (!o.bloom_level) {
      bloomPass = false;
      failure_reasons.push(`learning_outcomes[${i}]: bloom_level مفقود`);
    }
  });

  (plan.practice?.items ?? []).forEach((it, i) => {
    if (!it.bloom_level) {
      bloomPass = false;
      failure_reasons.push(`practice.items[${i}]: bloom_level مفقود`);
    }
  });

  (plan.assess?.items ?? []).forEach((it, i) => {
    if (!it.bloom_level) {
      bloomPass = false;
      failure_reasons.push(`assess.items[${i}]: bloom_level مفقود`);
    }
  });

  // ---------- Gate 2: QNCF ----------
  let qncfPass = true;

  const checkQncf = (code: string | undefined, where: string): void => {
    if (!code) {
      qncfPass = false;
      failure_reasons.push(`${where}: qncf_code مفقود`);
      return;
    }
    if (!QNCF_CODE_RE.test(code)) {
      qncfPass = false;
      failure_reasons.push(`${where}: صيغة qncf_code غير صالحة (${code})`);
      return;
    }
    if (!isKnownQncfCode(code)) {
      qncfPass = false;
      failure_reasons.push(`${where}: qncf_code غير موجود في القاعدة (${code})`);
    }
  };

  outcomes.forEach((o, i) => checkQncf(o.qncf_code, `learning_outcomes[${i}]`));
  checkQncf(plan.warm_up?.qncf_code, 'warm_up');
  checkQncf(plan.explore?.qncf_code, 'explore');
  checkQncf(plan.explain?.qncf_code, 'explain');
  if (plan.extend) checkQncf(plan.extend.qncf_code, 'extend');

  (plan.practice?.items ?? []).forEach((it, i) =>
    checkQncf(it.qncf_code, `practice.items[${i}]`),
  );
  (plan.assess?.items ?? []).forEach((it, i) =>
    checkQncf(it.qncf_code, `assess.items[${i}]`),
  );

  // ---------- Gate 3: Advisor ----------
  // Always starts pending — flipped by the advisor UI later.
  const advisorStatus: 'pending' | 'approved' | 'needs_revision' = 'pending';

  const results: GateResults = {
    bloom_gate: bloomPass ? 'pass' : 'fail',
    qncf_gate: qncfPass ? 'pass' : 'fail',
    advisor_gate: advisorStatus,
    failure_reasons,
  };

  // Triple-gate is "passed" only when both automated gates pass. The
  // advisor gate is informational here — `pending` does not block storage,
  // it just means a human still needs to review.
  const passed = bloomPass && qncfPass;

  return { passed, results, failure_reasons };
}
