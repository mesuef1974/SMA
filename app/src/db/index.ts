import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

/**
 * PostgreSQL connection via postgres.js driver.
 * Used by Drizzle ORM for all database operations.
 */
const client = postgres(connectionString);

/**
 * Drizzle ORM database instance with full schema awareness.
 * Import this in server-side code to perform type-safe queries.
 */
export const db = drizzle(client, { schema });
