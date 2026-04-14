-- =============================================================================
-- SMA Curriculum Duplication Fix — Phase B cleanup SQL  (top-down rewrite)
-- =============================================================================
-- Problem
-- -------
-- seed.ts ran ~9 times against a schema that lacked unique constraints on
-- grade_levels, chapters, lessons, and learning_outcomes. Every run inserted
-- fresh UUID rows, producing a TREE-shaped 9x duplication of the curriculum
-- graph:
--
--   subjects(1)
--     └─ grade_levels(9)        ← 9 dupes of the same natural key
--           └─ chapters(27)     ← 9 × 3 dupes (3 chapter "numbers")
--                 └─ lessons(135)              ← 27 × 5
--                       └─ learning_outcomes(333)  ← 9 × 37
--
-- A naive bottom-up dedupe (start at leaves) does NOT work, because at the
-- leaves the duplicated children all point to DIFFERENT parents, so each
-- (lesson_id, code) tuple has cardinality 1 — the GROUP BY finds no
-- duplicates and the cleanup is a no-op.
--
-- Fix strategy: top-down cascading
-- --------------------------------
--   STEP 1: dedupe grade_levels first (collapse 9 → 1 by natural key).
--           Repoint chapters.grade_level_id from losers → keeper.
--           DELETE losing grade_levels.
--   STEP 2: now all 27 chapters point at the same grade_level_id, so the
--           natural-key (grade_level_id, number) has cardinality 9.
--           Dedupe chapters (collapse 27 → 3). Repoint lessons.chapter_id.
--           DELETE losing chapters.
--   STEP 3: now all 135 lessons point at one of 3 chapters, so
--           (chapter_id, number) has cardinality 9.
--           Dedupe lessons (collapse 135 → 15). Repoint ALL inbound FKs
--           (learning_outcomes, student_misconceptions, assessments,
--           chat_sessions, lesson_plans). DELETE losing lessons.
--   STEP 4: now all 333 learning_outcomes point at one of 15 lessons, so
--           (lesson_id, code) has cardinality 9.
--           Dedupe learning_outcomes (collapse 333 → 37). No inbound FKs.
--           DELETE losing rows.
--
-- The whole script runs in a single transaction; ON_ERROR_STOP=1 (passed via
-- the psql command line) plus an explicit BEGIN/COMMIT means any failure
-- rolls back and leaves the database untouched.
--
-- FK audit (verified against information_schema before writing this script):
--   grade_levels      ← chapters.grade_level_id
--   chapters          ← lessons.chapter_id
--   lessons           ← learning_outcomes.lesson_id
--                     ← student_misconceptions.lesson_id
--                     ← assessments.lesson_id
--                     ← chat_sessions.lesson_id
--                     ← lesson_plans.lesson_id
--   learning_outcomes ← (no inbound FKs — leaf table)
--
-- After this script COMMITs, Phase B continues with:
--   1. `pnpm db:push`   — applies the 4 unique indexes from curriculum.ts
--   2. `pnpm db:seed`   — now fully idempotent thanks to explicit
--                          target: in every onConflictDoNothing()
-- =============================================================================

\set ON_ERROR_STOP on
\timing off

BEGIN;

-- -----------------------------------------------------------------------------
-- Pre-cleanup baseline counts
-- -----------------------------------------------------------------------------
\echo ''
\echo '================================================================'
\echo '  BEFORE CLEANUP'
\echo '================================================================'
SELECT 'subjects'           AS table_name, COUNT(*) AS row_count FROM subjects
UNION ALL SELECT 'grade_levels',        COUNT(*) FROM grade_levels
UNION ALL SELECT 'chapters',            COUNT(*) FROM chapters
UNION ALL SELECT 'lessons',             COUNT(*) FROM lessons
UNION ALL SELECT 'learning_outcomes',   COUNT(*) FROM learning_outcomes
UNION ALL SELECT 'misconception_types', COUNT(*) FROM misconception_types
UNION ALL SELECT 'xp_config',           COUNT(*) FROM xp_config
UNION ALL SELECT 'badge_definitions',   COUNT(*) FROM badge_definitions
ORDER BY table_name;

-- =============================================================================
-- STEP 1 — Dedupe grade_levels
-- Natural key: (grade, track, subject_id, academic_year)
-- Inbound FKs to repoint: chapters.grade_level_id
-- =============================================================================
\echo ''
\echo '--- STEP 1: grade_levels ---'

CREATE TEMP TABLE grade_level_dupes ON COMMIT DROP AS
WITH ranked AS (
  SELECT
    id,
    grade,
    track,
    subject_id,
    academic_year,
    ROW_NUMBER() OVER (
      PARTITION BY grade, track, subject_id, academic_year
      ORDER BY id
    ) AS rn,
    -- PG has no native MIN(uuid) aggregate, so use FIRST_VALUE with the
    -- same ORDER BY id as ROW_NUMBER — the row with rn=1 is the keeper.
    FIRST_VALUE(id) OVER (
      PARTITION BY grade, track, subject_id, academic_year
      ORDER BY id
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS keeper_id
  FROM grade_levels
)
SELECT id AS dup_id, keeper_id
FROM ranked
WHERE rn > 1;

SELECT 'grade_levels losers to delete' AS stage, COUNT(*) FROM grade_level_dupes;

UPDATE chapters
SET grade_level_id = d.keeper_id
FROM grade_level_dupes d
WHERE chapters.grade_level_id = d.dup_id;

DELETE FROM grade_levels
USING grade_level_dupes d
WHERE grade_levels.id = d.dup_id;

SELECT 'grade_levels remaining' AS stage, COUNT(*) FROM grade_levels;

-- =============================================================================
-- STEP 2 — Dedupe chapters
-- Now all chapters point at the keeper grade_level. The natural key
-- (grade_level_id, number) collapses 27 rows into 3 groups of 9.
-- Inbound FKs to repoint: lessons.chapter_id
-- =============================================================================
\echo ''
\echo '--- STEP 2: chapters ---'

CREATE TEMP TABLE chapter_dupes ON COMMIT DROP AS
WITH ranked AS (
  SELECT
    id,
    grade_level_id,
    number,
    ROW_NUMBER() OVER (
      PARTITION BY grade_level_id, number
      ORDER BY id
    ) AS rn,
    FIRST_VALUE(id) OVER (
      PARTITION BY grade_level_id, number
      ORDER BY id
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS keeper_id
  FROM chapters
)
SELECT id AS dup_id, keeper_id
FROM ranked
WHERE rn > 1;

SELECT 'chapters losers to delete' AS stage, COUNT(*) FROM chapter_dupes;

UPDATE lessons
SET chapter_id = d.keeper_id
FROM chapter_dupes d
WHERE lessons.chapter_id = d.dup_id;

DELETE FROM chapters
USING chapter_dupes d
WHERE chapters.id = d.dup_id;

SELECT 'chapters remaining' AS stage, COUNT(*) FROM chapters;

-- =============================================================================
-- STEP 3 — Dedupe lessons
-- Now all lessons point at one of 3 keeper chapters. The natural key
-- (chapter_id, number) collapses 135 rows into 15 groups of 9.
-- Inbound FKs to repoint:
--   learning_outcomes.lesson_id
--   student_misconceptions.lesson_id
--   assessments.lesson_id
--   chat_sessions.lesson_id
--   lesson_plans.lesson_id
-- =============================================================================
\echo ''
\echo '--- STEP 3: lessons ---'

CREATE TEMP TABLE lesson_dupes ON COMMIT DROP AS
WITH ranked AS (
  SELECT
    id,
    chapter_id,
    number,
    ROW_NUMBER() OVER (
      PARTITION BY chapter_id, number
      ORDER BY id
    ) AS rn,
    FIRST_VALUE(id) OVER (
      PARTITION BY chapter_id, number
      ORDER BY id
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS keeper_id
  FROM lessons
)
SELECT id AS dup_id, keeper_id
FROM ranked
WHERE rn > 1;

SELECT 'lessons losers to delete' AS stage, COUNT(*) FROM lesson_dupes;

UPDATE learning_outcomes
SET lesson_id = d.keeper_id
FROM lesson_dupes d
WHERE learning_outcomes.lesson_id = d.dup_id;

UPDATE student_misconceptions
SET lesson_id = d.keeper_id
FROM lesson_dupes d
WHERE student_misconceptions.lesson_id = d.dup_id;

UPDATE assessments
SET lesson_id = d.keeper_id
FROM lesson_dupes d
WHERE assessments.lesson_id = d.dup_id;

UPDATE chat_sessions
SET lesson_id = d.keeper_id
FROM lesson_dupes d
WHERE chat_sessions.lesson_id = d.dup_id;

UPDATE lesson_plans
SET lesson_id = d.keeper_id
FROM lesson_dupes d
WHERE lesson_plans.lesson_id = d.dup_id;

DELETE FROM lessons
USING lesson_dupes d
WHERE lessons.id = d.dup_id;

SELECT 'lessons remaining' AS stage, COUNT(*) FROM lessons;

-- =============================================================================
-- STEP 4 — Dedupe learning_outcomes (leaf — no inbound FKs)
-- Now all learning_outcomes point at one of 15 keeper lessons. The natural
-- key (lesson_id, code) collapses 333 rows into 37 groups of 9.
-- =============================================================================
\echo ''
\echo '--- STEP 4: learning_outcomes ---'

CREATE TEMP TABLE outcome_dupes ON COMMIT DROP AS
WITH ranked AS (
  SELECT
    id,
    lesson_id,
    code,
    ROW_NUMBER() OVER (
      PARTITION BY lesson_id, code
      ORDER BY id
    ) AS rn,
    FIRST_VALUE(id) OVER (
      PARTITION BY lesson_id, code
      ORDER BY id
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS keeper_id
  FROM learning_outcomes
)
SELECT id AS dup_id, keeper_id
FROM ranked
WHERE rn > 1;

SELECT 'learning_outcomes losers to delete' AS stage, COUNT(*) FROM outcome_dupes;

DELETE FROM learning_outcomes
USING outcome_dupes d
WHERE learning_outcomes.id = d.dup_id;

SELECT 'learning_outcomes remaining' AS stage, COUNT(*) FROM learning_outcomes;

-- -----------------------------------------------------------------------------
-- Post-cleanup verification counts
-- Expected: subjects=1, grade_levels=1, chapters=3, lessons=15,
--           learning_outcomes=37 (the catalog tables are untouched)
-- -----------------------------------------------------------------------------
\echo ''
\echo '================================================================'
\echo '  AFTER CLEANUP'
\echo '================================================================'
SELECT 'subjects'           AS table_name, COUNT(*) AS row_count FROM subjects
UNION ALL SELECT 'grade_levels',        COUNT(*) FROM grade_levels
UNION ALL SELECT 'chapters',            COUNT(*) FROM chapters
UNION ALL SELECT 'lessons',             COUNT(*) FROM lessons
UNION ALL SELECT 'learning_outcomes',   COUNT(*) FROM learning_outcomes
UNION ALL SELECT 'misconception_types', COUNT(*) FROM misconception_types
UNION ALL SELECT 'xp_config',           COUNT(*) FROM xp_config
UNION ALL SELECT 'badge_definitions',   COUNT(*) FROM badge_definitions
ORDER BY table_name;

COMMIT;

\echo ''
\echo '================================================================'
\echo '  COMMITTED. Run pnpm db:push then pnpm db:seed twice to verify.'
\echo '================================================================'
