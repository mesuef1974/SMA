-- BL-026 (2026-04-23) — Teacher notification read-state for advisor reviews.
--
-- Context: BL-026 introduces a bell-icon dropdown on the teacher dashboard
-- listing unread advisor decisions. Per-teacher read state is tracked with
-- a nullable timestamp on the existing review row — each review has exactly
-- one recipient (the plan's owning teacher), so a single column is enough.
--
-- NULL  = unread by the teacher.
-- !NULL = marked read at that time (clicking the review or opening the plan).
--
-- Additive only; existing rows remain NULL (surface as unread on first poll).
--
-- Apply via:
--   psql "$DATABASE_URL" -f drizzle/0004_add_review_read_by_teacher_at.sql

ALTER TABLE "public"."lesson_plan_reviews"
  ADD COLUMN IF NOT EXISTS "read_by_teacher_at" timestamptz;

-- Partial index to make the "list unread for plans owned by X" query fast
-- without bloating the index with already-read rows.
CREATE INDEX IF NOT EXISTS "lesson_plan_reviews_unread_idx"
  ON "public"."lesson_plan_reviews" ("lesson_plan_id")
  WHERE "read_by_teacher_at" IS NULL;
