import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;
type Context = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, context: Context, method: string) {
  const { path } = await context.params;
  const backendPath = `/api/ingestion/${path.join('/')}`;
  const search = req.nextUrl.search ?? '';
  const url = `${BACKEND_URL}${backendPath}${search}`;
  const cookie = req.headers.get('cookie') ?? '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(cookie ? { cookie } : {}),
  };
  const init: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'DELETE') {
    init.body = await req.text();
  }
  try {
    const res = await fetch(url, init);
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (err) {
    console.error(`INGESTION PROXY ERROR [${method} ${backendPath}]:`, err);
    return NextResponse.json({ error: 'PROXY_FAILED' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, context: Context)    { return proxy(req, context, 'GET'); }
export async function POST(req: NextRequest, context: Context)   { return proxy(req, context, 'POST'); }
export async function DELETE(req: NextRequest, context: Context) { return proxy(req, context, 'DELETE'); }