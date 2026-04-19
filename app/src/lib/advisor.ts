/**
 * Advisor helpers — DEC-SMA-037
 *
 * The Triple-Gate content-fidelity policy (D-34) blocks publication of
 * lesson plans until an academic advisor has marked `advisor_gate` as
 * `approved`. This module centralizes the advisor-privilege check.
 *
 * There is no dedicated `advisor` role in `users.role` today. Until that
 * migration lands, we grant advisor privileges to:
 *   1. Users whose role is `admin`
 *   2. Users whose email is present (case-insensitive) in the
 *      `ADVISOR_EMAILS` environment variable — a comma-separated allowlist.
 *
 * Example: ADVISOR_EMAILS="advisor1@education.qa,advisor2@education.qa"
 */

import type { Session } from 'next-auth';

export function getAdvisorEmails(): string[] {
  const raw = process.env.ADVISOR_EMAILS ?? '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns true if the session belongs to a user with advisor privileges.
 * Accepts a loosely-typed session because the NextAuth Session type is
 * consumed from multiple places.
 */
export function isAdvisor(
  session: Session | null | undefined,
): boolean {
  if (!session?.user) return false;
  if (session.user.role === 'admin') return true;

  const email = session.user.email?.toLowerCase();
  if (!email) return false;

  return getAdvisorEmails().includes(email);
}
