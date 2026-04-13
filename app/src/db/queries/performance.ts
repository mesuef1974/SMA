import { avg, count, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  assessmentQuestions,
  assessments,
  classroomStudents,
  lessons,
  misconceptionTypes,
  studentMisconceptions,
  studentResponses,
} from '@/db/schema';

// ---------------------------------------------------------------------------
// Performance DAL — student and classroom performance aggregation
// ---------------------------------------------------------------------------

/**
 * Comprehensive performance statistics for a single student.
 * Includes total exercises attempted, accuracy rate, and detected misconceptions.
 * Primary use: student performance dashboard, teacher student-detail view.
 */
export async function getStudentPerformance(studentId: string) {
  // Fetch response stats
  const [responseStats] = await db
    .select({
      totalResponses: count(studentResponses.id),
      correctResponses: count(
        sql`CASE WHEN ${studentResponses.isCorrect} = true THEN 1 END`,
      ),
      averageScore: avg(studentResponses.score),
    })
    .from(studentResponses)
    .where(eq(studentResponses.studentId, studentId));

  // Fetch misconceptions with type details
  const misconceptions = await db
    .select({
      id: studentMisconceptions.id,
      code: misconceptionTypes.code,
      nameAr: misconceptionTypes.nameAr,
      name: misconceptionTypes.name,
      severity: misconceptionTypes.severity,
      confidence: studentMisconceptions.confidence,
      resolved: studentMisconceptions.resolved,
      detectedAt: studentMisconceptions.detectedAt,
      remediationHintAr: misconceptionTypes.remediationHintAr,
      remediationHint: misconceptionTypes.remediationHint,
      lessonId: studentMisconceptions.lessonId,
    })
    .from(studentMisconceptions)
    .innerJoin(
      misconceptionTypes,
      eq(studentMisconceptions.misconceptionTypeId, misconceptionTypes.id),
    )
    .where(eq(studentMisconceptions.studentId, studentId))
    .orderBy(sql`${studentMisconceptions.detectedAt} DESC`);

  // Fetch per-lesson breakdown
  const lessonBreakdown = await db
    .select({
      lessonId: assessments.lessonId,
      lessonTitle: lessons.title,
      lessonTitleAr: lessons.titleAr,
      totalResponses: count(studentResponses.id),
      correctResponses: count(
        sql`CASE WHEN ${studentResponses.isCorrect} = true THEN 1 END`,
      ),
    })
    .from(studentResponses)
    .innerJoin(
      assessmentQuestions,
      eq(studentResponses.assessmentQuestionId, assessmentQuestions.id),
    )
    .innerJoin(
      assessments,
      eq(assessmentQuestions.assessmentId, assessments.id),
    )
    .innerJoin(lessons, eq(assessments.lessonId, lessons.id))
    .where(eq(studentResponses.studentId, studentId))
    .groupBy(assessments.lessonId, lessons.title, lessons.titleAr);

  const total = responseStats?.totalResponses ?? 0;
  const correct = responseStats?.correctResponses ?? 0;
  const accuracyRate = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    totalExercises: total,
    correctExercises: correct,
    accuracyRate,
    averageScore: responseStats?.averageScore
      ? Number(responseStats.averageScore)
      : 0,
    misconceptions,
    lessonBreakdown: lessonBreakdown.map((lb) => ({
      ...lb,
      accuracyRate:
        lb.totalResponses > 0
          ? Math.round((lb.correctResponses / lb.totalResponses) * 100)
          : 0,
    })),
  };
}

/**
 * Aggregate performance across all students in a classroom.
 * Returns per-student summary with accuracy rate and misconception count.
 * Primary use: teacher dashboard — class overview.
 */
export async function getClassPerformance(classroomId: string) {
  // Get all students in this classroom
  const students = await db
    .select({
      id: classroomStudents.id,
      displayName: classroomStudents.displayName,
      displayNameAr: classroomStudents.displayNameAr,
      joinedAt: classroomStudents.joinedAt,
      lastActiveAt: classroomStudents.lastActiveAt,
    })
    .from(classroomStudents)
    .where(eq(classroomStudents.classroomId, classroomId));

  // For each student, get response stats and misconception count
  const studentPerformances = await Promise.all(
    students.map(async (student) => {
      const [responseStats] = await db
        .select({
          totalResponses: count(studentResponses.id),
          correctResponses: count(
            sql`CASE WHEN ${studentResponses.isCorrect} = true THEN 1 END`,
          ),
        })
        .from(studentResponses)
        .where(eq(studentResponses.studentId, student.id));

      const [misconceptionStats] = await db
        .select({
          totalMisconceptions: count(studentMisconceptions.id),
          unresolvedMisconceptions: count(
            sql`CASE WHEN ${studentMisconceptions.resolved} = false THEN 1 END`,
          ),
        })
        .from(studentMisconceptions)
        .where(eq(studentMisconceptions.studentId, student.id));

      const total = responseStats?.totalResponses ?? 0;
      const correct = responseStats?.correctResponses ?? 0;

      return {
        ...student,
        totalExercises: total,
        correctExercises: correct,
        accuracyRate: total > 0 ? Math.round((correct / total) * 100) : 0,
        totalMisconceptions: misconceptionStats?.totalMisconceptions ?? 0,
        unresolvedMisconceptions:
          misconceptionStats?.unresolvedMisconceptions ?? 0,
      };
    }),
  );

  // Compute class-wide most common misconceptions
  const commonMisconceptions = await db
    .select({
      code: misconceptionTypes.code,
      nameAr: misconceptionTypes.nameAr,
      name: misconceptionTypes.name,
      severity: misconceptionTypes.severity,
      remediationHintAr: misconceptionTypes.remediationHintAr,
      occurrences: count(studentMisconceptions.id),
    })
    .from(studentMisconceptions)
    .innerJoin(
      misconceptionTypes,
      eq(studentMisconceptions.misconceptionTypeId, misconceptionTypes.id),
    )
    .innerJoin(
      classroomStudents,
      eq(studentMisconceptions.studentId, classroomStudents.id),
    )
    .where(eq(classroomStudents.classroomId, classroomId))
    .groupBy(
      misconceptionTypes.code,
      misconceptionTypes.nameAr,
      misconceptionTypes.name,
      misconceptionTypes.severity,
      misconceptionTypes.remediationHintAr,
    )
    .orderBy(sql`count(${studentMisconceptions.id}) DESC`)
    .limit(10);

  return {
    students: studentPerformances,
    commonMisconceptions,
    classStats: {
      totalStudents: students.length,
      averageAccuracy:
        studentPerformances.length > 0
          ? Math.round(
              studentPerformances.reduce((sum, s) => sum + s.accuracyRate, 0) /
                studentPerformances.length,
            )
          : 0,
    },
  };
}

/**
 * Retrieve all responses submitted by a student, with question details.
 * Primary use: detailed student response history view.
 */
export async function getStudentResponsesByStudent(studentId: string) {
  return db
    .select({
      responseId: studentResponses.id,
      response: studentResponses.response,
      isCorrect: studentResponses.isCorrect,
      score: studentResponses.score,
      aiFeedback: studentResponses.aiFeedback,
      aiFeedbackAr: studentResponses.aiFeedbackAr,
      submittedAt: studentResponses.submittedAt,
      questionText: assessmentQuestions.questionText,
      questionTextAr: assessmentQuestions.questionTextAr,
      correctAnswer: assessmentQuestions.correctAnswer,
      bloomLevel: assessmentQuestions.bloomLevel,
      assessmentId: assessments.id,
      assessmentTitle: assessments.title,
      assessmentTitleAr: assessments.titleAr,
      lessonId: assessments.lessonId,
    })
    .from(studentResponses)
    .innerJoin(
      assessmentQuestions,
      eq(studentResponses.assessmentQuestionId, assessmentQuestions.id),
    )
    .innerJoin(
      assessments,
      eq(assessmentQuestions.assessmentId, assessments.id),
    )
    .where(eq(studentResponses.studentId, studentId))
    .orderBy(sql`${studentResponses.submittedAt} DESC`);
}
