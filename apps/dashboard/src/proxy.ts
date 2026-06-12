import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/share',
  '/onboarding',
  '/forgot-password',
  '/reset-password',
  '/invites/accept',
];

const BILLING_EXEMPT = [
  '/v2/subscription',
  ...PUBLIC_PATHS,
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Auth check
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get('refresh_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Billing check
  const isExempt = BILLING_EXEMPT.some((p) => pathname.startsWith(p));
  if (!isExempt) {
    try {
      const res = await fetch(`${process.env.BACKEND_URL}/api/billing/status`, {
        headers: { Cookie: `refresh_token=${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'EXPIRED' || data.status === 'CANCELLED' || data.isExpired) {
          return NextResponse.redirect(new URL('/v2/subscription', request.url));
        }
      }
    } catch {
      // fail open
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};