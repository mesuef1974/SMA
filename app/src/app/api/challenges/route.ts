import { auth } from '@/lib/auth';
import {
  createChallenge,
  createTeams,
  assignStudentsToTeams,
} from '@/db/queries';

// ---------------------------------------------------------------------------
// Default Arabic team names
// ---------------------------------------------------------------------------

const DEFAULT_TEAM_NAMES: Record<number, string[]> = {
  2: ['الفريق الأزرق', 'الفريق الأحمر'],
  3: ['الفريق الأزرق', 'الفريق الأحمر', 'الفريق الأخضر'],
  4: ['الفريق الأزرق', 'الفريق الأحمر', 'الفريق الأخضر', 'الفريق الذهبي'],
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CreateBody {
  classroomId: string;
  titleAr: string;
  questionCount: number;
  timeLimitSeconds: number;
  teamCount: number;
}

function validateCreateBody(
  body: unknown,
): { ok: true; data: CreateBody } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'جسم الطلب غير صالح' };
  }

  const { classroomId, titleAr, questionCount, timeLimitSeconds, teamCount } =
    body as Record<string, unknown>;

  if (typeof classroomId !== 'string' || !UUID_RE.test(classroomId)) {
    return { ok: false, error: 'معرف الصف غير صالح' };
  }
  if (typeof titleAr !== 'string' || titleAr.trim().length === 0) {
    return { ok: false, error: 'عنوان التحدي مطلوب' };
  }
  if (typeof questionCount !== 'number' || ![5, 10, 15].includes(questionCount)) {
    return { ok: false, error: 'عدد الأسئلة يجب أن يكون 5 أو 10 أو 15' };
  }
  if (
    typeof timeLimitSeconds !== 'number' ||
    ![15, 30, 60].includes(timeLimitSeconds)
  ) {
    return { ok: false, error: 'وقت كل سؤال يجب أن يكون 15 أو 30 أو 60 ثانية' };
  }
  if (typeof teamCount !== 'number' || ![2, 3, 4].includes(teamCount)) {
    return { ok: false, error: 'عدد الفرق يجب أن يكون 2 أو 3 أو 4' };
  }

  return {
    ok: true,
    data: {
      classroomId,
      titleAr: titleAr.trim(),
      questionCount,
      timeLimitSeconds,
      teamCount,
    },
  };
}

// ---------------------------------------------------------------------------
// POST /api/challenges — teacher creates a new challenge
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { error: 'غير مصرح — يرجى تسجيل الدخول' },
      { status: 401 },
    );
  }

  if (session.user.role !== 'teacher' && session.user.role !== 'admin') {
    return Response.json(
      { error: 'غير مصرح — التحديات متاحة للمعلمين فقط' },
      { status: 403 },
    );
  }

  try {
    const body: unknown = await req.json();
    const validation = validateCreateBody(body);

    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const { classroomId, titleAr, questionCount, timeLimitSeconds, teamCount } =
      validation.data;

    // Total time = timeLimitSeconds * questionCount (time per question * number of questions)
    const totalTimeSeconds = timeLimitSeconds * questionCount;

    // 1. Create the challenge
    const challenge = await createChallenge(
      classroomId,
      session.user.id,
      titleAr,
      questionCount,
      totalTimeSeconds,
    );

    // 2. Create teams with default Arabic names
    const teamNames = DEFAULT_TEAM_NAMES[teamCount] ?? DEFAULT_TEAM_NAMES[2];
    await createTeams(challenge.id, teamNames);

    // 3. Auto-assign students to teams
    await assignStudentsToTeams(challenge.id, classroomId);

    return Response.json(
      { challengeId: challenge.id },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/challenges] Error:', error);
    return Response.json(
      { error: 'حدث خطأ أثناء إنشاء التحدي' },
      { status: 500 },
    );
  }
}
