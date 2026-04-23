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

// Gate 2 is intentionally frozen at *format* validation (regex above) until a
// canonical QNCF catalog is available. A stub that returns `true` would have
// masked failures as passes — worse than no check. The catalog-membership
// check is tracked as the `advisor_gate` human sign-off for now.
// See DEC-SMA-047.

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
    // Catalog-membership check deferred to advisor_gate (human review).
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

// ---------------------------------------------------------------------------
// Gate 2.5 — Source Traceability (founder directive 2026-04-18)
// ---------------------------------------------------------------------------

/**
 * Validates that every section's `teacher_guide_page` falls within the
 * lesson's declared page range. Ensures each plan element can be traced
 * back to the official teacher guide — no fabrication allowed.
 */
export function validateSourceTraceability(
  plan: LessonPlanData,
  lesson: { pageStartTe: number | null; pageEndTe: number | null },
): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Fail-closed: reject lessons with missing page-range metadata.
  // Without both bounds we cannot meaningfully validate source traceability,
  // so Gate 2.5 must fail loudly instead of silently passing (DEC-SMA QA F1).
  if (lesson.pageStartTe === null || lesson.pageEndTe === null) {
    return {
      passed: false,
      reasons: [
        'بيانات الدرس ناقصة: pageStartTe أو pageEndTe غير مُسجَّل. لا يمكن التحقق من نطاق المصدر.',
      ],
    };
  }

  const minPage = lesson.pageStartTe;
  const maxPage = lesson.pageEndTe;

  const sections: { name: string; page: number | undefined }[] = [
    { name: 'warm_up', page: plan.warm_up?.teacher_guide_page },
    { name: 'explore', page: plan.explore?.teacher_guide_page },
    { name: 'explain', page: plan.explain?.teacher_guide_page },
    { name: 'practice', page: plan.practice?.teacher_guide_page },
    { name: 'assess', page: plan.assess?.teacher_guide_page },
  ];

  if (plan.extend) {
    sections.push({ name: 'extend', page: plan.extend.teacher_guide_page });
  }

  for (const s of sections) {
    if (s.page === undefined || s.page === null) {
      reasons.push(`${s.name}: teacher_guide_page مفقود`);
      continue;
    }
    if (s.page < minPage || s.page > maxPage) {
      reasons.push(
        `صفحة المصدر خارج نطاق الدرس: ${s.name} صفحة ${s.page} خارج [${minPage}-${maxPage}]`,
      );
    }
  }

  // Per-item checks (practice + assess)
  (plan.practice?.items ?? []).forEach((it, i) => {
    const p = it.teacher_guide_page;
    if (p !== undefined && p !== null && (p < minPage || p > maxPage)) {
      reasons.push(
        `صفحة المصدر خارج نطاق الدرس: practice.items[${i}] صفحة ${p} خارج [${minPage}-${maxPage}]`,
      );
    }
  });

  (plan.assess?.items ?? []).forEach((it, i) => {
    const p = it.teacher_guide_page;
    if (p !== undefined && p !== null && (p < minPage || p > maxPage)) {
      reasons.push(
        `صفحة المصدر خارج نطاق الدرس: assess.items[${i}] صفحة ${p} خارج [${minPage}-${maxPage}]`,
      );
    }
  });

  return { passed: reasons.length === 0, reasons };
}
