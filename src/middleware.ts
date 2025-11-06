// middleware.ts
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||            // Next.js internals
    pathname === '/favicon.ico' ||              // favicon
    /\.[a-zA-Z0-9]+$/.test(pathname)            // any /file.ext (e.g., .svg, .png, .js, .css, .map, .txt)
  ) {
    return NextResponse.next();
  }
  return intlMiddleware(req);
}

// Only run middleware for app routes (not for api, _next, favicon, login, error, or any path with a dot)
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|error|.*\\..*).*)',
  ],
};
