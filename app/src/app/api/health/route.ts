/**
 * Health check endpoint for Railway deployment monitoring.
 * Returns 200 with status info. Does NOT require authentication.
 */
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  });
}
