/**
 * Advisor helpers — DEC-SMA-037 / P1.1
 *
 * The Triple-Gate content-fidelity policy (D-34) blocks publication of
 * lesson plans until an academic advisor has marked `advisor_gate` as
 * `approved`. This module centralizes the advisor-privilege check.
 *
 * As of P1.1, advisor privileges are granted via the `users.role` column
 * (enum value `'advisor'`). Users with `role === 'admin'` are also treated
 * as advisors for authorization purposes. The legacy `ADVISOR_EMAILS`
 * environment variable is no longer consulted.
 */

import type { Session } from 'next-auth';

/**
 * Returns true if the session belongs to a user with advisor privileges.
 * Accepts a loosely-typed session because the NextAuth Session type is
 * consumed from multiple places.
 */
export function isAdvisor(
  session: Session | null | undefined,
): boolean {
  if (!session?.user) return false;
  const role = session.user.role;
  return role === 'advisor' || role === 'admin';
}

export {
  ADVISOR_DECISIONS,
  isAdvisorDecision,
  type AdvisorDecision,
} from './decisions';
