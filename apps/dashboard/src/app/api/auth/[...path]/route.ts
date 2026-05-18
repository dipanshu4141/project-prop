export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;
type Context = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, context: Context, method: string) {
  const { path } = await context.params;
  const backendPath = `/api/auth/${path.join('/')}`;
  const search = req.nextUrl.search ?? '';
  const url = `${BACKEND_URL}${backendPath}${search}`;
  const cookie = req.headers.get('cookie') ?? '';

  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
  };
  if (method !== 'GET' && method !== 'DELETE') init.body = await req.text();

  try {
    const res = await fetch(url, init);

    if (res.status === 204) return new NextResponse(null, { status: 204 });
    if (res.redirected) return NextResponse.redirect(res.url);

    const text = await res.text();

    const nextRes = new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });

    // Forward ALL Set-Cookie headers, rewritten for same-origin
    const rawHeaders = res.headers.getSetCookie?.() ?? [];
    for (const raw of rawHeaders) {
      // Rewrite: remove domain, change sameSite to lax, keep httpOnly+secure
      const rewritten = raw
        .replace(/;\s*domain=[^;]+/gi, '')
        .replace(/;\s*samesite=none/gi, '; SameSite=Lax');
      nextRes.headers.append('Set-Cookie', rewritten);
    }

    return nextRes;
  } catch (err) {
    return NextResponse.json({ error: 'PROXY_FAILED' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, context: Context)  { return proxy(req, context, 'GET'); }
export async function POST(req: NextRequest, context: Context) { return proxy(req, context, 'POST'); }