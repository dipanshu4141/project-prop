import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Paths that do NOT require authentication.
 * Prefix-matched: /share covers /share/[any-token]
 */
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/share',          // ← client-facing property sharing portal
  '/forgot-password',
  '/reset-password',
  '/invites/accept'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public paths (prefix match)
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  // Allow Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const token =
    request.cookies.get('access_token')?.value ??
    request.cookies.get('token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};