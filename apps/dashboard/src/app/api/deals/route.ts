// apps/dashboard/src/app/api/deals/route.ts
// Handles GET /api/deals and POST /api/deals (no sub-path)

import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000';

async function forward(req: NextRequest) {
  const url = `${BACKEND}/api/deals${req.nextUrl.search}`;
  const res = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text(),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest)  { return forward(req); }
export async function POST(req: NextRequest) { return forward(req); }