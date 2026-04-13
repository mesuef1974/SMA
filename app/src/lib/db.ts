/**
 * Database client re-export for convenience.
 * Uses Drizzle ORM with postgres.js driver connected to Railway PostgreSQL.
 *
 * Usage:
 *   import { db } from '@/lib/db';
 *   const users = await db.query.users.findMany();
 */
export { db } from '@/db';
export type { db as Database } from '@/db';
