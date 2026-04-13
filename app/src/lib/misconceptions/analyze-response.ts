// ---------------------------------------------------------------------------
// Misconception Detection Integration
// Called after each incorrect student response to detect and log misconceptions
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { misconceptionTypes } from '@/db/schema';
import { logMisconception } from '@/db/queries';
import { detectMisconceptions, type DetectionResult } from './detector';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalysisResult {
  detected: boolean;
  misconceptionType?: string;
  confidence?: number;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Analyzes a student's incorrect response for misconceptions.
 * Uses the AI-powered detector to identify misconceptions from the catalog,
 * then persists any detected misconceptions to the database.
 *
 * @param questionText - The question the student answered
 * @param studentResponse - The student's incorrect response
 * @param correctAnswer - The expected correct answer
 * @param lessonId - The lesson this question belongs to
 * @param studentId - The student who submitted the response
 * @returns Analysis result with detection status, misconception type, and confidence
 */
export async function analyzeStudentResponse(
  questionText: string,
  studentResponse: string,
  correctAnswer: string,
  lessonId: string,
  studentId: string,
): Promise<AnalysisResult> {
  // Run AI-powered misconception detection
  const result: DetectionResult = await detectMisconceptions(studentResponse, {
    questionText,
    expectedAnswer: correctAnswer,
    locale: 'ar',
  });

  if (!result.detected || result.misconceptions.length === 0) {
    return { detected: false };
  }

  // Use the highest-confidence misconception
  const topMisconception = result.misconceptions.reduce((best, current) =>
    current.confidence > best.confidence ? current : best,
  );

  // Look up the misconception type in the database by its code
  const [misconceptionType] = await db
    .select({ id: misconceptionTypes.id })
    .from(misconceptionTypes)
    .where(eq(misconceptionTypes.code, topMisconception.code))
    .limit(1);

  if (!misconceptionType) {
    // Misconception code found by detector but not in DB — still report detection
    return {
      detected: true,
      misconceptionType: topMisconception.code,
      confidence: topMisconception.confidence,
    };
  }

  // Persist the detected misconception
  await logMisconception({
    studentId,
    misconceptionTypeId: misconceptionType.id,
    lessonId,
    detectionSource: 'assessment',
    confidence: topMisconception.confidence,
  });

  return {
    detected: true,
    misconceptionType: topMisconception.code,
    confidence: topMisconception.confidence,
  };
}
