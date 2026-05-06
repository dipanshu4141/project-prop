// apps/dashboard/src/app/api/onboarding/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;

type Context = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, context: Context, method: string) {
  const { path } = await context.params;
  const backendPath = `/api/onboarding/${path.join('/')}`;
  const url    = `${BACKEND_URL}${backendPath}`;
  const cookie = req.headers.get('cookie') ?? '';

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
  };

  if (method !== 'GET') {
    init.body = await req.text();
  }

  try {
    const res  = await fetch(url, init);
    const text = await res.text();
    return new NextResponse(text, {
      status:  res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (err) {
    console.error(`ONBOARDING PROXY ERROR [${method} ${backendPath}]:`, err);
    return NextResponse.json({ error: 'ONBOARDING_PROXY_FAILED' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: Context)    { return proxy(req, ctx, 'GET'); }
export async function POST(req: NextRequest, ctx: Context)   { return proxy(req, ctx, 'POST'); }
export async function PATCH(req: NextRequest, ctx: Context)  { return proxy(req, ctx, 'PATCH'); }