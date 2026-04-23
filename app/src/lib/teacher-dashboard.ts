// ---------------------------------------------------------------------------
// Teacher Dashboard v2 — data aggregation helpers for the Bento home.
// Reads directly via Drizzle from RSC. No HTTP hop.
// ---------------------------------------------------------------------------

import { and, eq, gte, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  lessonPlans,
  lessons,
  chapters,
  misconceptionTypes,
  studentMisconceptions,
  classrooms,
  classroomStudents,
} from '@/db/schema';
import { getGradeLevelForSubject } from '@/db/queries';

export type DashboardStats = {
  totalPlans: number;
  approved: number;
  drafts: number;
  inReview: number;
  totalLessons: number;
  totalMisconceptionTypes: number;
  recentMisconceptionCount: number;
  completionPct: number;
};

export type DashboardLessonItem = {
  id: string;
  number: number;
  chapter: number;
  title: string;
  period?: number;
  minutes: number;
  status: 'draft' | 'review' | 'approved';
  planId?: string;
};

export type DashboardMisconception = {
  id: string;
  name_ar: string;
  frequency: number;
  severity: 'high' | 'medium' | 'low';
};

export type DashboardBloom = {
  remember: number;
  understand: number;
  apply: number;
  analyze: number;
  evaluate: number;
  create: number;
};

export type DashboardSparklines = {
  /** Plans created by this teacher per day (last 7 days, oldest-first). */
  plansCreated: number[];
  /** Distinct lessons prepared (plans grouped by lesson) per day. */
  lessonsPrepared: number[];
  /** Students who joined this teacher's classrooms per day. */
  studentsEngaged: number[];
  /** Misconceptions detected across this teacher's classrooms per day. */
  misconceptionsFlagged: number[];
  /** Plans approved (status = approved, by updatedAt) per day. */
  plansApproved: number[];
};

export type DashboardData = {
  stats: DashboardStats;
  todayLesson:
    | {
        id: string;
        title: string;
        chapter: number;
        period?: number;
      }
    | null;
  weekLessons: DashboardLessonItem[];
  misconceptions: DashboardMisconception[];
  bloom: DashboardBloom;
  sparklines: DashboardSparklines;
};

// ---------------------------------------------------------------------------
// Sparkline helper — bucketize a list of {day: 'YYYY-MM-DD', count: number}
// rows into a fixed-length array[7] aligned to the last 7 local days
// (oldest first). Missing days fill with 0.
// ---------------------------------------------------------------------------
function bucketizeLast7Days(
  rows: Array<{ day: string | null; count: number | null }>,
): number[] {
  const buckets = new Array<number>(7).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // YYYY-MM-DD (UTC-agnostic — use local date parts so it aligns with
    // DATE(created_at) evaluated in the database's default timezone).
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    keys.push(`${y}-${m}-${dd}`);
  }
  const keyIdx = new Map(keys.map((k, i) => [k, i]));
  for (const r of rows) {
    if (!r.day) continue;
    // Normalize row key — PostgreSQL's DATE() cast may return either a
    // plain 'YYYY-MM-DD' string or an ISO timestamp depending on driver.
    const k = r.day.slice(0, 10);
    const idx = keyIdx.get(k);
    if (idx !== undefined) buckets[idx] = Number(r.count ?? 0);
  }
  return buckets;
}

// Normalize lesson-plan status -> UI status bucket.
function mapStatus(s: string | null): 'draft' | 'review' | 'approved' {
  if (s === 'approved') return 'approved';
  if (s === 'in_review') return 'review';
  return 'draft';
}

/**
 * Load the full dashboard payload for a given teacher in one go.
 * Falls back to safe empty structures when data is missing.
 */
export async function getTeacherDashboardData(
  teacherId: string,
  opts: { subjectCode?: string; academicYear?: string } = {},
): Promise<DashboardData> {
  const subjectCode = opts.subjectCode ?? 'MATH';
  const academicYear = opts.academicYear ?? '2025-2026';

  // Plans authored by this teacher (newest-first) + joined lesson/chapter.
  const plans = await db.query.lessonPlans.findMany({
    where: eq(lessonPlans.teacherId, teacherId),
    orderBy: (lp, { desc }) => desc(lp.createdAt),
    with: { lesson: { with: { chapter: true } } },
    limit: 200,
  });

  const totalPlans = plans.length;
  const approved = plans.filter((p) => p.status === 'approved').length;
  const drafts = plans.filter((p) => p.status === 'draft').length;
  const inReview = plans.filter((p) => p.status === 'in_review').length;

  // Curriculum size (all lessons for subject grade level).
  const grade = await getGradeLevelForSubject(subjectCode, academicYear);
  let totalLessons = 0;
  if (grade) {
    const row = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(lessons)
      .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
      .where(eq(chapters.gradeLevelId, grade.id));
    totalLessons = row[0]?.c ?? 0;
  }

  // Misconception catalog + last-week detections.
  const allTypes = await db.query.misconceptionTypes.findMany({
    orderBy: (mt, { asc }) => asc(mt.nameAr),
  });

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentRow = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(studentMisconceptions)
    .where(gte(studentMisconceptions.detectedAt, oneWeekAgo));
  const recentMisconceptionCount = recentRow[0]?.c ?? 0;

  // Top misconceptions for sidebar: aggregate all-time occurrences by type.
  const freqRows = await db
    .select({
      id: misconceptionTypes.id,
      nameAr: misconceptionTypes.nameAr,
      severity: misconceptionTypes.severity,
      occurrences: sql<number>`count(${studentMisconceptions.id})::int`,
    })
    .from(misconceptionTypes)
    .leftJoin(
      studentMisconceptions,
      eq(studentMisconceptions.misconceptionTypeId, misconceptionTypes.id),
    )
    .groupBy(
      misconceptionTypes.id,
      misconceptionTypes.nameAr,
      misconceptionTypes.severity,
    )
    .limit(50);

  const severityRank = { high: 3, medium: 2, low: 1 } as const;
  const ranked = [...freqRows]
    .sort((a, b) => {
      const byFreq = (b.occurrences ?? 0) - (a.occurrences ?? 0);
      if (byFreq !== 0) return byFreq;
      return (
        (severityRank[(b.severity ?? 'low') as 'low'] ?? 0) -
        (severityRank[(a.severity ?? 'low') as 'low'] ?? 0)
      );
    })
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      name_ar: r.nameAr,
      frequency: r.occurrences ?? 0,
      severity: (r.severity ?? 'low') as 'high' | 'medium' | 'low',
    }));
  // If every top candidate has zero detections, surface empty state instead
  // of cards that say "0 طالبًا · عالية" (QA #5, 2026-04-22).
  const topMisconceptions: DashboardMisconception[] = ranked.every(
    (m) => m.frequency === 0,
  )
    ? []
    : ranked;

  // Week lessons — surface up to 4 most-recent plans.
  const weekLessons: DashboardLessonItem[] = plans.slice(0, 4).map((p) => ({
    id: p.lessonId ?? p.id,
    planId: p.id,
    number: p.lesson?.sortOrder ?? 0,
    chapter: p.lesson?.chapter?.number ?? 0,
    title: p.lesson?.titleAr ?? p.lesson?.title ?? 'درس بدون عنوان',
    period: p.periodNumber ?? undefined,
    minutes: 45,
    status: mapStatus(p.status),
  }));

  // Today's lesson — first approved plan (or first in review).
  const todayPlan =
    plans.find((p) => p.status === 'approved') ??
    plans.find((p) => p.status === 'in_review') ??
    plans[0];
  const todayLesson = todayPlan
    ? {
        id: todayPlan.lessonId ?? todayPlan.id,
        title:
          todayPlan.lesson?.titleAr ??
          todayPlan.lesson?.title ??
          'درس بدون عنوان',
        chapter: todayPlan.lesson?.chapter?.number ?? 0,
        period: todayPlan.periodNumber ?? undefined,
      }
    : null;

  // Bloom distribution — aggregate real bloom_level values from each plan's
  // section_data (jsonb). Sources per plan:
  //   - learning_outcomes[].bloom_level
  //   - practice.items[].bloom_level
  //   - assess.items[].bloom_level
  // Only plans in approved/in_review contribute so the chart reflects
  // "finalized pedagogy", not half-written drafts.
  const bloom: DashboardBloom = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0,
  };
  const validBloom = new Set<keyof DashboardBloom>([
    'remember',
    'understand',
    'apply',
    'analyze',
    'evaluate',
    'create',
  ]);
  const bumpBloom = (level: unknown) => {
    if (typeof level === 'string' && validBloom.has(level as keyof DashboardBloom)) {
      bloom[level as keyof DashboardBloom] += 1;
    }
  };
  for (const p of plans) {
    if (p.status !== 'approved' && p.status !== 'in_review') continue;
    const sd = (p.sectionData ?? null) as Record<string, unknown> | null;
    if (!sd) continue;
    const los = (sd['learning_outcomes'] as Array<{ bloom_level?: unknown }> | undefined) ?? [];
    for (const lo of los) bumpBloom(lo?.bloom_level);
    const practice = sd['practice'] as { items?: Array<{ bloom_level?: unknown }> } | undefined;
    for (const it of practice?.items ?? []) bumpBloom(it?.bloom_level);
    const assess = sd['assess'] as { items?: Array<{ bloom_level?: unknown }> } | undefined;
    for (const it of assess?.items ?? []) bumpBloom(it?.bloom_level);
    // Also pick up header.bloom_levels if a future pedagogy-map injection
    // writes it there (currently absent from the schema but cheap to read).
    const header = sd['header'] as { bloom_levels?: unknown } | undefined;
    if (Array.isArray(header?.bloom_levels)) {
      for (const b of header!.bloom_levels) bumpBloom(b);
    }
  }

  const completionPct =
    totalLessons > 0 ? Math.round((approved / totalLessons) * 100) : 0;

  // -------------------------------------------------------------------------
  // Sparkline series — last 7 days of real activity, bucketed per day.
  // Each query uses DATE(col) on a timestamp and a 7-day lower bound; results
  // are normalized to a fixed-length array[7] (oldest-first) via bucketize.
  // -------------------------------------------------------------------------
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Plans created by this teacher per day.
  const plansCreatedRows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${lessonPlans.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(lessonPlans)
    .where(
      and(
        eq(lessonPlans.teacherId, teacherId),
        gte(lessonPlans.createdAt, sevenDaysAgo),
      ),
    )
    .groupBy(sql`date_trunc('day', ${lessonPlans.createdAt})`);

  // Distinct lessons with at least one plan created per day.
  const lessonsPreparedRows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${lessonPlans.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(DISTINCT ${lessonPlans.lessonId})::int`,
    })
    .from(lessonPlans)
    .where(
      and(
        eq(lessonPlans.teacherId, teacherId),
        gte(lessonPlans.createdAt, sevenDaysAgo),
      ),
    )
    .groupBy(sql`date_trunc('day', ${lessonPlans.createdAt})`);

  // Plans approved per day (by updatedAt if present, else createdAt).
  const plansApprovedRows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${lessonPlans.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(lessonPlans)
    .where(
      and(
        eq(lessonPlans.teacherId, teacherId),
        eq(lessonPlans.status, 'approved'),
        gte(lessonPlans.createdAt, sevenDaysAgo),
      ),
    )
    .groupBy(sql`date_trunc('day', ${lessonPlans.createdAt})`);

  // Students joined to this teacher's classrooms per day.
  const studentsEngagedRows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${classroomStudents.joinedAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(classroomStudents)
    .innerJoin(classrooms, eq(classroomStudents.classroomId, classrooms.id))
    .where(
      and(
        eq(classrooms.teacherId, teacherId),
        gte(classroomStudents.joinedAt, sevenDaysAgo),
      ),
    )
    .groupBy(sql`date_trunc('day', ${classroomStudents.joinedAt})`);

  // Misconceptions detected per day (platform-wide, mirrors
  // `recentMisconceptionCount` scoping which is not teacher-filtered).
  const misconceptionsFlaggedRows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${studentMisconceptions.detectedAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(studentMisconceptions)
    .where(gte(studentMisconceptions.detectedAt, sevenDaysAgo))
    .groupBy(sql`date_trunc('day', ${studentMisconceptions.detectedAt})`);

  const sparklines: DashboardSparklines = {
    plansCreated: bucketizeLast7Days(plansCreatedRows),
    lessonsPrepared: bucketizeLast7Days(lessonsPreparedRows),
    plansApproved: bucketizeLast7Days(plansApprovedRows),
    studentsEngaged: bucketizeLast7Days(studentsEngagedRows),
    misconceptionsFlagged: bucketizeLast7Days(misconceptionsFlaggedRows),
  };

  return {
    stats: {
      totalPlans,
      approved,
      drafts,
      inReview,
      totalLessons,
      totalMisconceptionTypes: allTypes.length,
      recentMisconceptionCount,
      completionPct,
    },
    todayLesson,
    weekLessons,
    misconceptions: topMisconceptions,
    bloom,
    sparklines,
  };
}

// Silence unused-import warning for `and` if we add filter clauses later.
export const _and = and;
