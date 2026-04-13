import { cookies } from 'next/headers';

import { db } from '@/db';
import { studentResponses, assessmentQuestions, assessments } from '@/db/schema';
import { eq } from 'drizzle-orm';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_RESPONSES = 100;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestBody {
  assessmentId: string;
  studentId: string;
  responses: { questionId: string; response: string }[];
}

interface FeedbackItem {
  questionId: string;
  questionText: string;
  questionTextAr: string;
  questionType: string | null;
  bloomLevel: string | null;
  studentResponse: string;
  correctAnswer: string | null;
  isCorrect: boolean;
  points: number;
  earnedPoints: number;
}

interface SuccessResponse {
  totalQuestions: number;
  correctCount: number;
  score: number;
  feedback: FeedbackItem[];
}

interface ErrorResponse {
  error: string;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateBody(body: unknown): { ok: true; data: RequestBody } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Invalid request body' };
  }

  const { assessmentId, studentId, responses } = body as Record<string, unknown>;

  if (typeof assessmentId !== 'string' || !UUID_RE.test(assessmentId)) {
    return { ok: false, error: 'assessmentId must be a valid UUID' };
  }

  if (typeof studentId !== 'string' || !UUID_RE.test(studentId)) {
    return { ok: false, error: 'studentId must be a valid UUID' };
  }

  if (!Array.isArray(responses)) {
    return { ok: false, error: 'responses must be an array' };
  }

  if (responses.length > MAX_RESPONSES) {
    return { ok: false, error: `responses array cannot exceed ${MAX_RESPONSES} items` };
  }

  for (let i = 0; i < responses.length; i++) {
    const r = responses[i] as Record<string, unknown>;
    if (typeof r?.questionId !== 'string') {
      return { ok: false, error: `responses[${i}].questionId is required` };
    }
    if (typeof r?.response !== 'string') {
      return { ok: false, error: `responses[${i}].response must be a string` };
    }
  }

  return {
    ok: true,
    data: {
      assessmentId,
      studentId,
      responses: responses as { questionId: string; response: string }[],
    },
  };
}

// ---------------------------------------------------------------------------
// Grading logic
// ---------------------------------------------------------------------------

/**
 * Compare student response to correct answer.
 * For MCQ and short_answer: exact match (case-insensitive, trimmed).
 * For math_input: exact LaTeX match (trimmed).
 * For essay: always returns false (requires manual grading).
 */
function checkAnswer(
  studentResponse: string,
  correctAnswer: string | null,
  questionType: string | null,
): boolean {
  if (!correctAnswer) return false;

  const normalized = studentResponse.trim().toLowerCase();
  const expected = correctAnswer.trim().toLowerCase();

  switch (questionType) {
    case 'multiple_choice':
    case 'short_answer':
      return normalized === expected;
    case 'math_input':
      // Trim whitespace from LaTeX strings and compare
      return studentResponse.trim() === correctAnswer.trim();
    case 'essay':
      // Essay requires manual/AI grading — auto-grade as false
      return false;
    default:
      return normalized === expected;
  }
}

// ---------------------------------------------------------------------------
// POST /api/student/submit-responses
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  // --- Cookie-based student authentication ---
  const cookieStore = await cookies();
  const cookieStudentId = cookieStore.get('studentId')?.value;

  if (!cookieStudentId) {
    return Response.json(
      { error: 'غير مصرّح — يرجى الانضمام للفصل أولاً' } satisfies ErrorResponse,
      { status: 401 },
    );
  }

  try {
    const body: unknown = await req.json();
    const validation = validateBody(body);

    if (!validation.ok) {
      return Response.json(
        { error: validation.error } satisfies ErrorResponse,
        { status: 400 },
      );
    }

    const { assessmentId, studentId, responses } = validation.data;

    // Verify the request studentId matches the authenticated cookie
    if (studentId !== cookieStudentId) {
      return Response.json(
        { error: 'غير مصرّح — معرف الطالب غير متطابق' } satisfies ErrorResponse,
        { status: 403 },
      );
    }

    // Verify assessment exists
    const assessment = await db.query.assessments.findFirst({
      where: eq(assessments.id, assessmentId),
    });

    if (!assessment) {
      return Response.json(
        { error: 'Assessment not found' } satisfies ErrorResponse,
        { status: 404 },
      );
    }

    // Fetch all questions for this assessment
    const questions = await db.query.assessmentQuestions.findMany({
      where: eq(assessmentQuestions.assessmentId, assessmentId),
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Grade each response and prepare DB inserts
    const feedback: FeedbackItem[] = [];
    const dbInserts: (typeof studentResponses.$inferInsert)[] = [];
    let correctCount = 0;

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId);

      if (!question) continue;

      const isCorrect = checkAnswer(resp.response, question.correctAnswer, question.questionType);
      const points = question.points ?? 1;
      const earnedPoints = isCorrect ? points : 0;

      if (isCorrect) correctCount++;

      feedback.push({
        questionId: question.id,
        questionText: question.questionText,
        questionTextAr: question.questionTextAr,
        questionType: question.questionType,
        bloomLevel: question.bloomLevel,
        studentResponse: resp.response,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points,
        earnedPoints,
      });

      dbInserts.push({
        assessmentQuestionId: question.id,
        studentId,
        response: resp.response,
        isCorrect,
        score: earnedPoints,
      });
    }

    // Insert all responses into the database
    if (dbInserts.length > 0) {
      await db.insert(studentResponses).values(dbInserts);
    }

    const totalQuestions = feedback.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return Response.json({
      totalQuestions,
      correctCount,
      score,
      feedback,
    } satisfies SuccessResponse);
  } catch (error) {
    console.error('[/api/student/submit-responses] Error:', error);

    return Response.json(
      { error: 'حدث خطأ غير متوقع أثناء إرسال الإجابات' } satisfies ErrorResponse,
      { status: 500 },
    );
  }
}
