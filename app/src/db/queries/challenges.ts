import { and, count, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  challenges,
  challengeTeams,
  challengeParticipants,
  challengeResponses,
  classroomStudents,
} from '@/db/schema';
import { awardXP } from './gamification';

// ---------------------------------------------------------------------------
// Challenges DAL — live challenge engine operations
// ---------------------------------------------------------------------------

const XP_PER_CORRECT = 10;

/**
 * Team colour palette for auto-assignment.
 */
const TEAM_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'] as const;

/**
 * Create a new challenge in draft status.
 * The teacher specifies classroom, title, question count, and time limit.
 */
export async function createChallenge(
  classroomId: string,
  teacherId: string,
  titleAr: string,
  questionCount: number,
  timeLimitSeconds: number,
) {
  const [challenge] = await db
    .insert(challenges)
    .values({
      classroomId,
      teacherId,
      titleAr,
      questionCount,
      timeLimitSeconds,
    })
    .returning();
  return challenge;
}

/**
 * Start a challenge — transitions from draft to active and records start time.
 */
export async function startChallenge(challengeId: string) {
  const [updated] = await db
    .update(challenges)
    .set({
      status: 'active',
      startedAt: new Date(),
    })
    .where(eq(challenges.id, challengeId))
    .returning();
  return updated;
}

/**
 * End a challenge — transitions to completed and records end time.
 */
export async function endChallenge(challengeId: string) {
  const [updated] = await db
    .update(challenges)
    .set({
      status: 'completed',
      endedAt: new Date(),
    })
    .where(eq(challenges.id, challengeId))
    .returning();
  return updated;
}

/**
 * Create teams for a challenge.
 * Accepts an array of Arabic team names and assigns colours from the palette.
 */
export async function createTeams(challengeId: string, teamNames: string[]) {
  const values = teamNames.map((nameAr, i) => ({
    challengeId,
    nameAr,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
  }));
  return db.insert(challengeTeams).values(values).returning();
}

/**
 * Auto-distribute classroom students into teams evenly (round-robin).
 * Students are shuffled before assignment to avoid deterministic ordering.
 */
export async function assignStudentsToTeams(
  challengeId: string,
  classroomId: string,
) {
  // Fetch teams for this challenge
  const teams = await db
    .select()
    .from(challengeTeams)
    .where(eq(challengeTeams.challengeId, challengeId));

  if (teams.length === 0) return [];

  // Fetch active students in the classroom
  const students = await db
    .select()
    .from(classroomStudents)
    .where(
      and(
        eq(classroomStudents.classroomId, classroomId),
        eq(classroomStudents.isActive, true),
      ),
    );

  // Shuffle students (Fisher-Yates)
  const shuffled = [...students];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Round-robin assignment
  const participantValues = shuffled.map((student, index) => ({
    challengeId,
    teamId: teams[index % teams.length].id,
    studentId: student.id,
  }));

  if (participantValues.length === 0) return [];

  return db.insert(challengeParticipants).values(participantValues).returning();
}

/**
 * Submit a challenge response for a participant.
 * Records the answer, correctness, time taken, and awards XP if correct.
 */
export async function submitChallengeResponse(
  participantId: string,
  challengeId: string,
  questionIndex: number,
  response: string,
  isCorrect: boolean,
  timeMs: number,
) {
  const xpEarned = isCorrect ? XP_PER_CORRECT : 0;

  const [inserted] = await db
    .insert(challengeResponses)
    .values({
      challengeId,
      participantId,
      questionIndex,
      response,
      isCorrect,
      timeMs,
      xpEarned,
    })
    .returning();

  // Award XP to the student if correct
  if (isCorrect) {
    const participant = await db
      .select({ studentId: challengeParticipants.studentId })
      .from(challengeParticipants)
      .where(eq(challengeParticipants.id, participantId))
      .then((rows) => rows[0]);

    if (participant) {
      await awardXP(
        participant.studentId,
        xpEarned,
        'challenge',
        challengeId,
        `تحدٍ مباشر — سؤال ${questionIndex + 1}`,
      );
    }
  }

  return { ...inserted, xpEarned };
}

/**
 * Get the live leaderboard for a challenge — team scores.
 * Score = sum of xpEarned for correct responses per team.
 *
 * Uses a single joined query instead of per-team queries to avoid N+1.
 */
export async function getChallengeLeaderboard(challengeId: string) {
  const teams = await db
    .select({
      id: challengeTeams.id,
      nameAr: challengeTeams.nameAr,
      color: challengeTeams.color,
    })
    .from(challengeTeams)
    .where(eq(challengeTeams.challengeId, challengeId));

  if (teams.length === 0) return [];

  // Single query: join teams -> participants -> responses, grouped by team
  const teamScoreRows = await db
    .select({
      teamId: challengeParticipants.teamId,
      score: sql<number>`COALESCE(SUM(${challengeResponses.xpEarned}), 0)`,
      correctCount: sql<number>`COALESCE(SUM(CASE WHEN ${challengeResponses.isCorrect} THEN 1 ELSE 0 END), 0)`,
    })
    .from(challengeParticipants)
    .leftJoin(
      challengeResponses,
      and(
        eq(challengeResponses.participantId, challengeParticipants.id),
        eq(challengeResponses.challengeId, challengeId),
      ),
    )
    .where(eq(challengeParticipants.challengeId, challengeId))
    .groupBy(challengeParticipants.teamId);

  const scoreMap = new Map(
    teamScoreRows.map((r) => [
      r.teamId,
      { score: Number(r.score), correctCount: Number(r.correctCount) },
    ]),
  );

  const teamScores = teams.map((team) => {
    const stats = scoreMap.get(team.id);
    return {
      ...team,
      score: stats?.score ?? 0,
      correctCount: stats?.correctCount ?? 0,
    };
  });

  // Sort by score descending
  return teamScores.sort((a, b) => b.score - a.score);
}

/**
 * Get challenge status with teams, participant counts, and response progress.
 * Used by both SSE stream and GET endpoint.
 */
export async function getChallengeStatus(challengeId: string) {
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });

  if (!challenge) return null;

  const teams = await db
    .select()
    .from(challengeTeams)
    .where(eq(challengeTeams.challengeId, challengeId));

  const [participantCount] = await db
    .select({ count: count(challengeParticipants.id) })
    .from(challengeParticipants)
    .where(eq(challengeParticipants.challengeId, challengeId));

  const [responseCount] = await db
    .select({ count: count(challengeResponses.id) })
    .from(challengeResponses)
    .where(eq(challengeResponses.challengeId, challengeId));

  // Calculate time remaining if challenge is active
  let timeRemaining = challenge.timeLimitSeconds;
  if (challenge.status === 'active' && challenge.startedAt) {
    const elapsed = Math.floor(
      (Date.now() - challenge.startedAt.getTime()) / 1000,
    );
    timeRemaining = Math.max(0, challenge.timeLimitSeconds - elapsed);
  }

  return {
    id: challenge.id,
    titleAr: challenge.titleAr,
    status: challenge.status,
    questionCount: challenge.questionCount,
    timeLimitSeconds: challenge.timeLimitSeconds,
    timeRemaining,
    startedAt: challenge.startedAt?.toISOString() ?? null,
    endedAt: challenge.endedAt?.toISOString() ?? null,
    teams: teams.map((t) => ({
      id: t.id,
      nameAr: t.nameAr,
      color: t.color,
    })),
    participantCount: participantCount?.count ?? 0,
    responseCount: responseCount?.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Challenge Report — full post-game report data
// ---------------------------------------------------------------------------

/**
 * Get full challenge report for a completed challenge.
 * Returns challenge info, team rankings, student performance,
 * question-level accuracy, and summary statistics.
 */
export async function getChallengeReport(challengeId: string) {
  // 1. Fetch challenge info
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
  });

  if (!challenge) return null;

  // Actual duration in seconds (startedAt to endedAt)
  let durationSeconds = challenge.timeLimitSeconds;
  if (challenge.startedAt && challenge.endedAt) {
    durationSeconds = Math.floor(
      (challenge.endedAt.getTime() - challenge.startedAt.getTime()) / 1000,
    );
  }

  // 2. Fetch teams
  const teams = await db
    .select()
    .from(challengeTeams)
    .where(eq(challengeTeams.challengeId, challengeId));

  // 3. Fetch all participants with student data
  const participants = await db
    .select({
      id: challengeParticipants.id,
      teamId: challengeParticipants.teamId,
      studentId: challengeParticipants.studentId,
      displayNameAr: classroomStudents.displayNameAr,
      displayName: classroomStudents.displayName,
    })
    .from(challengeParticipants)
    .innerJoin(
      classroomStudents,
      eq(challengeParticipants.studentId, classroomStudents.id),
    )
    .where(eq(challengeParticipants.challengeId, challengeId));

  // 4. Fetch all responses for this challenge
  const responses = await db
    .select()
    .from(challengeResponses)
    .where(eq(challengeResponses.challengeId, challengeId));

  // ---------------------------------------------------------------------------
  // Build team rankings
  // ---------------------------------------------------------------------------
  const teamRankings = teams
    .map((team) => {
      const teamParticipantIds = participants
        .filter((p) => p.teamId === team.id)
        .map((p) => p.id);

      const teamResponses = responses.filter((r) =>
        teamParticipantIds.includes(r.participantId),
      );

      const score = teamResponses.reduce((s, r) => s + (r.xpEarned ?? 0), 0);
      const correctCount = teamResponses.filter((r) => r.isCorrect).length;
      const totalTimeMs = teamResponses.reduce((s, r) => s + (r.timeMs ?? 0), 0);
      const avgTimeMs =
        teamResponses.length > 0
          ? Math.round(totalTimeMs / teamResponses.length)
          : 0;

      return {
        id: team.id,
        nameAr: team.nameAr,
        color: team.color,
        score,
        correctCount,
        avgTimeMs,
        memberCount: teamParticipantIds.length,
      };
    })
    .sort((a, b) => b.score - a.score);

  // ---------------------------------------------------------------------------
  // Build student performance
  // ---------------------------------------------------------------------------
  const studentPerformance = participants
    .map((p) => {
      const studentResponses = responses.filter(
        (r) => r.participantId === p.id,
      );
      const correctCount = studentResponses.filter((r) => r.isCorrect).length;
      const totalXP = studentResponses.reduce(
        (s, r) => s + (r.xpEarned ?? 0),
        0,
      );
      const totalTimeMs = studentResponses.reduce(
        (s, r) => s + (r.timeMs ?? 0),
        0,
      );
      const avgTimeMs =
        studentResponses.length > 0
          ? Math.round(totalTimeMs / studentResponses.length)
          : 0;

      const team = teams.find((t) => t.id === p.teamId);

      return {
        participantId: p.id,
        studentId: p.studentId,
        name: p.displayNameAr || p.displayName,
        teamNameAr: team?.nameAr ?? '',
        teamColor: team?.color ?? null,
        correctCount,
        totalXP,
        avgTimeMs,
      };
    })
    .sort((a, b) => b.totalXP - a.totalXP);

  // ---------------------------------------------------------------------------
  // Question accuracy distribution
  // ---------------------------------------------------------------------------
  const questionAccuracy: { questionIndex: number; correctPercentage: number }[] = [];

  for (let i = 0; i < challenge.questionCount; i++) {
    const questionResponses = responses.filter((r) => r.questionIndex === i);
    const total = questionResponses.length;
    const correct = questionResponses.filter((r) => r.isCorrect).length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    questionAccuracy.push({ questionIndex: i, correctPercentage: percentage });
  }

  // ---------------------------------------------------------------------------
  // Summary statistics
  // ---------------------------------------------------------------------------
  const totalParticipants = participants.length;
  const totalCorrect = responses.filter((r) => r.isCorrect).length;
  const totalResponses = responses.length;
  const avgScore =
    totalResponses > 0
      ? Math.round((totalCorrect / totalResponses) * 100)
      : 0;

  const totalXPDistributed = responses.reduce(
    (s, r) => s + (r.xpEarned ?? 0),
    0,
  );

  // Fastest correct response
  const correctResponses = responses.filter(
    (r) => r.isCorrect && r.timeMs != null,
  );
  const fastestCorrectMs =
    correctResponses.length > 0
      ? Math.min(...correctResponses.map((r) => r.timeMs!))
      : 0;

  const fastestTeam =
    teamRankings.length > 0 ? teamRankings[0] : null;
  const slowestTeam =
    teamRankings.length > 0 ? teamRankings[teamRankings.length - 1] : null;

  return {
    challenge: {
      id: challenge.id,
      titleAr: challenge.titleAr,
      questionCount: challenge.questionCount,
      timeLimitSeconds: challenge.timeLimitSeconds,
      durationSeconds,
      startedAt: challenge.startedAt?.toISOString() ?? null,
      endedAt: challenge.endedAt?.toISOString() ?? null,
    },
    teamRankings,
    studentPerformance,
    questionAccuracy,
    stats: {
      totalParticipants,
      avgScore,
      fastestCorrectMs,
      totalXPDistributed,
      fastestTeamNameAr: fastestTeam?.nameAr ?? null,
      slowestTeamNameAr: slowestTeam?.nameAr ?? null,
    },
  };
}
