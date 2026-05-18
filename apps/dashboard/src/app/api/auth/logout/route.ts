export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;

export async function POST(req: NextRequest) {
  const cookie = req.headers.get('cookie') ?? '';

  const res = await fetch(`${BACKEND_URL}/api/auth/logout`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', cookie },
  });

  const nextRes = new NextResponse(null, { status: 204 });

  // Forward ALL Set-Cookie headers to clear browser cookies
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookies) {
    nextRes.headers.append('Set-Cookie', c);
  }

  return nextRes;
}