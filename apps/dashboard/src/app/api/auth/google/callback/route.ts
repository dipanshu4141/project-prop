import { NextRequest, NextResponse } from 'next/server';

const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTS = [
  'HttpOnly',
  'Path=/',
  'SameSite=Lax',
  IS_PROD ? 'Secure' : '',
].filter(Boolean).join('; ');

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const accessToken  = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const planSelected = searchParams.get('plan_selected') === 'true';

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL('/login?error=google_failed', req.url));
  }

  const destination = planSelected
    ? '/v2/dashboard'
    : '/onboarding?step=plan&type=INDIVIDUAL';

  const res = NextResponse.redirect(new URL(destination, req.url));

  // Set cookies same-origin from Next.js
  const accessMaxAge  = 15 * 60;
  const refreshMaxAge = 30 * 24 * 60 * 60;

  res.headers.append(
    'Set-Cookie',
    `access_token=${accessToken}; Max-Age=${accessMaxAge}; ${COOKIE_OPTS}`,
  );
  res.headers.append(
    'Set-Cookie',
    `refresh_token=${refreshToken}; Max-Age=${refreshMaxAge}; ${COOKIE_OPTS}`,
  );

  return res;
}