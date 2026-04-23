/**
 * Advisor decision enum — single source of truth.
 *
 * P1.3 cleanup (2026-04-23): the API + DB + review-history table all use
 * `'approved' | 'rejected' | 'changes_requested'`. Some older UI copy
 * referred to `'needs_revision'` / `'pending'` for the same concept; those
 * are presentation-layer aliases and are NOT part of the canonical enum.
 *
 * Consumers (API routes, UI action bar, Stream D prepare-view) should import
 * `ADVISOR_DECISIONS` / `AdvisorDecision` from here instead of redefining
 * the union locally.
 */

export const ADVISOR_DECISIONS = [
  'approved',
  'rejected',
  'changes_requested',
] as const;

export type AdvisorDecision = (typeof ADVISOR_DECISIONS)[number];

/**
 * Narrowing helper — useful for validating untyped input (e.g. form data,
 * URL params) before passing to the API.
 */
export function isAdvisorDecision(value: unknown): value is AdvisorDecision {
  return (
    typeof value === 'string' &&
    (ADVISOR_DECISIONS as readonly string[]).includes(value)
  );
}
