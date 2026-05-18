export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL!;

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = `${BACKEND}/api/shortlists/${path.join('/')}`;
  const res = await fetch(url, {
    method:  req.method,
    headers: {
      'Content-Type': 'application/json',
      cookie:         req.headers.get('cookie') ?? '',
    },
    body: req.method !== 'GET' && req.method !== 'DELETE' ? await req.text() : undefined,
  });
  const text = await res.text();
  return new NextResponse(text || null, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET    = proxy;
export const POST   = proxy;
export const PATCH  = proxy;
export const DELETE = proxy;