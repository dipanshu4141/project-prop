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
    // Handle redirects from Google OAuth
    if (res.redirected) return NextResponse.redirect(res.url);
    const text = await res.text();
    const headers: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
    };
    // Forward Set-Cookie headers
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      // Rewrite cookie for current domain — fixes Safari + mobile
      const rewritten = setCookie
        .replace(/Domain=[^;]+;?\s*/gi, '')
        .replace(/SameSite=\w+/gi, 'SameSite=Lax');
      headers['set-cookie'] = rewritten;
    }

    return new NextResponse(text, { status: res.status, headers });
  } catch (err) {
    return NextResponse.json({ error: 'PROXY_FAILED' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, context: Context)  { return proxy(req, context, 'GET'); }
export async function POST(req: NextRequest, context: Context) { return proxy(req, context, 'POST'); }