-- P1.1 (2026-04-21) — add 'advisor' value to user_role enum
--
-- Context: prior to this migration, academic-advisor authorization was
-- implemented by an `ADVISOR_EMAILS` environment variable (comma-separated
-- email allowlist consulted by src/lib/advisor.ts). This coupled
-- authorization policy to deployment config and made promotions require a
-- redeploy. This migration adds 'advisor' to the `user_role` enum so the
-- check can be expressed as `users.role = 'advisor'` (DB-backed).
--
-- This migration is additive only — no rows are rewritten and no existing
-- enum value is removed. PostgreSQL's ALTER TYPE ... ADD VALUE is
-- idempotent via IF NOT EXISTS.
--
-- Also ensures new rows default to 'teacher' when role is unspecified, to
-- preserve backward compatibility with older insert paths.
--
-- Apply to production manually (Railway) via:
--   psql "$DATABASE_URL" -f drizzle/0002_add_advisor_role.sql
-- or with drizzle-kit:
--   pnpm db:push

ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'advisor';

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'teacher';
