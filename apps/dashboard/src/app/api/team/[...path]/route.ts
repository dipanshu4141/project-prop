export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(req.url);
  const backendUrl = `${BACKEND_URL}/api/team/${path.join('/')}${url.search}`;

  const res = await fetch(backendUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
    body: req.method !== 'GET' && req.method !== 'DELETE' ? await req.text() : undefined,
  });

  return new NextResponse(await res.text(), { status: res.status });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
