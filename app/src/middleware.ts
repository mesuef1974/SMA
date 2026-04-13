import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except:
  // - API routes (/api/...)
  // - Next.js internals (/_next/...)
  // - Static files with extensions (.ico, .png, etc.)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
