-- P1.3 (2026-04-21) — Review history log for advisor decisions
--
-- Context: DEC-SMA-037 advisor review workflow previously stored only the
-- latest decision in `lesson_plans.section_data.gate_results` (overwritten
-- on every decision). To satisfy auditability + the new
-- "Request Changes" flow, each decision is now appended to a dedicated
-- `lesson_plan_reviews` table along with an optional rubric-score payload
-- (jsonb, populated once P1.2 rubric lands).
--
-- Changes:
--   1. New enum `lesson_plan_review_decision` with values
--      { approved | rejected | changes_requested }.
--   2. New table `lesson_plan_reviews` (append-only history).
--   3. New value `changes_requested` added to `lesson_plan_status` enum so
--      a plan can transition back to a review-needed terminal state.
--
-- Additive only; no existing rows are rewritten.
--
-- Apply via:
--   psql "$DATABASE_URL" -f drizzle/0003_add_lesson_plan_reviews.sql

-- 1. Review-decision enum ---------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'lesson_plan_review_decision'
  ) THEN
    CREATE TYPE "public"."lesson_plan_review_decision" AS ENUM (
      'approved',
      'rejected',
      'changes_requested'
    );
  END IF;
END$$;

-- 2. History table ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."lesson_plan_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lesson_plan_id" uuid NOT NULL
    REFERENCES "public"."lesson_plans"("id") ON DELETE CASCADE,
  "reviewer_id" uuid NOT NULL
    REFERENCES "public"."users"("id"),
  "decision" "public"."lesson_plan_review_decision" NOT NULL,
  "comment" text,
  "rubric_scores" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "lesson_plan_reviews_plan_id_idx"
  ON "public"."lesson_plan_reviews" ("lesson_plan_id");

CREATE INDEX IF NOT EXISTS "lesson_plan_reviews_created_at_idx"
  ON "public"."lesson_plan_reviews" ("created_at" DESC);

-- 3. Extend lesson_plan_status enum ----------------------------------------
ALTER TYPE "public"."lesson_plan_status"
  ADD VALUE IF NOT EXISTS 'changes_requested';
