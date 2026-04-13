/**
 * CSRF Protection — Origin Header Validation
 *
 * Validates that the Origin (or Referer) header on state-changing requests
 * matches the application's domain. This prevents cross-site request forgery
 * by rejecting requests that originate from external domains.
 *
 * NextAuth v5 handles CSRF for its own routes (/api/auth/*).
 * This utility covers custom POST/PATCH/DELETE API routes.
 */

/**
 * Validates that the request Origin (or Referer) header matches the
 * application's allowed origins. Returns `true` if the origin is valid,
 * `false` otherwise.
 *
 * Allowed origins are derived from:
 *   - NEXTAUTH_URL environment variable (production)
 *   - localhost:3000 (development fallback)
 */
export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  const allowedOrigins = getAllowedOrigins();

  // Check Origin header first (preferred)
  if (origin) {
    return allowedOrigins.some((allowed) => origin === allowed);
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      return allowedOrigins.some((allowed) => refererOrigin === allowed);
    } catch {
      return false;
    }
  }

  // No Origin or Referer header — reject the request.
  // Server-to-server calls (e.g., cURL, Postman) won't have these headers,
  // but browser-initiated requests always will.
  return false;
}

/**
 * Returns a 403 Forbidden response for CSRF validation failures.
 */
export function csrfForbiddenResponse(): Response {
  return Response.json(
    { error: 'طلب مرفوض — مصدر غير موثوق' },
    { status: 403 },
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Production origin from NextAuth URL
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    try {
      origins.push(new URL(nextAuthUrl).origin);
    } catch {
      // Ignore malformed NEXTAUTH_URL
    }
  }

  // Development fallback
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000');
  }

  return origins;
}
