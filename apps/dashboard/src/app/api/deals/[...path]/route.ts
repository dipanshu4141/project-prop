export const runtime = 'edge';
// apps/dashboard/src/app/api/deals/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL!;  // http://localhost:3001 — no /api suffix

async function forward(req: NextRequest, path: string[]) {
  const url = `${BACKEND}/api/deals/${path.join('/')}${req.nextUrl.search}`;
  const res = await fetch(url, {
    method:  req.method,
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text(),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forward(req, path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forward(req, path);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forward(req, path);
}