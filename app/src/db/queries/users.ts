import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema';
import type { User } from '@/db/schema';

// ---------------------------------------------------------------------------
// Users DAL — authentication, profiles, and school-level user lookups
// ---------------------------------------------------------------------------

/**
 * Retrieve a user by email address.
 * Primary use: authentication flow (login / session validation).
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

/**
 * Retrieve a user by primary key.
 * Includes the related school record when present.
 * Primary use: dashboard display, profile pages.
 */
export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      school: true,
    },
  });
}

/**
 * List all teachers belonging to a specific school.
 * Primary use: admin dashboard — teacher roster.
 */
export async function getTeachersBySchool(schoolId: string) {
  return db.query.users.findMany({
    where: (u, { eq, and }) =>
      and(eq(u.schoolId, schoolId), eq(u.role, 'teacher')),
    columns: {
      passwordHash: false,
    },
    with: {
      school: true,
    },
    limit: 200,
  });
}
