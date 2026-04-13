import { getChallengeStatus, getChallengeLeaderboard } from '@/db/queries';

// ---------------------------------------------------------------------------
// GET /api/challenges/[challengeId]/stream
// SSE endpoint — streams live challenge status, scores, and responses.
// Uses ReadableStream with 2-second polling (DEC-SMA-029: SSE, not WS).
// No auth required — students access via cookie-based sessions.
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ challengeId: string }> },
) {
  const { challengeId } = await params;

  if (!UUID_RE.test(challengeId)) {
    return Response.json(
      { error: 'معرف التحدي غير صالح' },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  let closed = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      /** Send an SSE event to the client. */
      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          closed = true;
        }
      }

      /** Poll the database and push SSE events. */
      async function poll() {
        if (closed) return;

        try {
          const status = await getChallengeStatus(challengeId);
          if (!status) {
            send('error', { message: 'التحدي غير موجود' });
            controller.close();
            closed = true;
            return;
          }

          // Send challenge status
          send('status', {
            status: status.status,
            timeRemaining: status.timeRemaining,
            questionCount: status.questionCount,
            participantCount: status.participantCount,
            responseCount: status.responseCount,
          });

          // Send team scores
          const leaderboard = await getChallengeLeaderboard(challengeId);
          send('scores', {
            teams: leaderboard.map((team) => ({
              id: team.id,
              nameAr: team.nameAr,
              color: team.color,
              score: team.score,
              correctCount: team.correctCount,
            })),
          });

          // Auto-close when challenge ends
          if (status.status === 'completed') {
            send('status', {
              status: 'completed',
              timeRemaining: 0,
              questionCount: status.questionCount,
              participantCount: status.participantCount,
              responseCount: status.responseCount,
            });
            controller.close();
            closed = true;
            return;
          }

          // Auto-end if time has expired but status not yet updated
          if (status.status === 'active' && status.timeRemaining <= 0) {
            send('status', {
              status: 'active',
              timeRemaining: 0,
              questionCount: status.questionCount,
              participantCount: status.participantCount,
              responseCount: status.responseCount,
            });
          }
        } catch (err) {
          console.error('[SSE /challenges/stream] Poll error:', err);
        }
      }

      // Initial push
      await poll();

      // Poll every 2 seconds
      intervalId = setInterval(async () => {
        if (closed) {
          clearInterval(intervalId!);
          intervalId = null;
          return;
        }
        await poll();
      }, 2000);
    },

    cancel() {
      closed = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
