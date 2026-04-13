import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Paths that require authentication (checked after locale prefix is stripped)
const protectedPaths = ['/dashboard'];
const protectedApiPaths = ['/api/bloom', '/api/misconceptions', '/api/chat', '/api/lesson-plans', '/api/reports', '/api/challenges'];

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.slice(`/${locale}`.length) || '/';
    }
  }
  return pathname;
}

function isProtectedPage(pathname: string): boolean {
  const strippedPath = stripLocale(pathname);
  return protectedPaths.some((p) => strippedPath.startsWith(p));
}

// Paths under /api/challenges that students access with cookies (no teacher auth)
const challengeStudentPaths = ['/stream', '/respond'];

function isProtectedApi(pathname: string): boolean {
  // Allow student-facing challenge sub-routes through without teacher auth
  if (pathname.startsWith('/api/challenges/')) {
    if (challengeStudentPaths.some((p) => pathname.endsWith(p))) {
      return false;
    }
  }
  return protectedApiPaths.some((p) => pathname.startsWith(p));
}

function getLoginUrl(request: NextRequest): URL {
  // Determine locale from path or default
  let locale = routing.defaultLocale;
  for (const loc of routing.locales) {
    if (
      request.nextUrl.pathname.startsWith(`/${loc}/`) ||
      request.nextUrl.pathname === `/${loc}`
    ) {
      locale = loc;
      break;
    }
  }

  // localePrefix is "as-needed", so default locale has no prefix
  const loginPath =
    locale === routing.defaultLocale ? '/login' : `/${locale}/login`;
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
  return loginUrl;
}

function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get('authjs.session-token')?.value ??
    request.cookies.get('__Secure-authjs.session-token')?.value
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Protected API routes ---
  if (isProtectedApi(pathname)) {
    const token = getSessionToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // --- Protected page routes ---
  if (isProtectedPage(pathname)) {
    const token = getSessionToken(request);
    if (!token) {
      return NextResponse.redirect(getLoginUrl(request));
    }
  }

  // --- i18n middleware for all page routes ---
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except:
  // - NextAuth API routes (/api/auth/...)
  // - Next.js internals (/_next/...)
  // - Static files with extensions (.ico, .png, etc.)
  matcher: ['/((?!api/auth|_next|.*\\..*).*)'],
};
