// apps/dashboard/src/app/api/admin/[...path]/route.ts
//
// Single catch-all proxy for ALL admin routes.
// Handles: GET /api/admin/**  →  NestJS GET /admin/**
//          PATCH /api/admin/** →  NestJS PATCH /admin/**
// etc.
//
// This replaces the need for 16 individual route.ts files.

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;

type Context = { params: Promise<{ path: string[] }> };

// ── Shared proxy handler ──────────────────────────────────────────────────────

async function proxy(req: NextRequest, context: Context, method: string) {
  const { path } = await context.params;

  // Reconstruct the backend path: /api/admin/properties/stats → /api/admin/properties/stats
  // NestJS has a global /api prefix, so all routes are /api/admin/...
  const backendPath = `/api/admin/${path.join('/')}`;

  // Preserve query string
  const search = req.nextUrl.search ?? '';
  const url    = `${BACKEND_URL}${backendPath}${search}`;

  // Forward auth cookie so JwtAuthGuard + platformRole check pass
  const cookie = req.headers.get('cookie') ?? '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(cookie ? { cookie } : {}),
  };

  const init: RequestInit = { method, headers };

  // Forward body for mutating methods
  if (method !== 'GET' && method !== 'DELETE') {
    init.body = await req.text();
  }

  try {
    const res  = await fetch(url, init);
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const text = await res.text();
    return new NextResponse(text, {
      status:  res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (err) {
    console.error(`ADMIN PROXY ERROR [${method} ${backendPath}]:`, err);
    return NextResponse.json(
      { error: 'ADMIN_PROXY_FAILED' },
      { status: 502 },
    );
  }
}

// ── Exported HTTP method handlers ─────────────────────────────────────────────

export async function GET(req: NextRequest, context: Context) {
  return proxy(req, context, 'GET');
}

export async function POST(req: NextRequest, context: Context) {
  return proxy(req, context, 'POST');
}

export async function PATCH(req: NextRequest, context: Context) {
  return proxy(req, context, 'PATCH');
}

export async function DELETE(req: NextRequest, context: Context) {
  return proxy(req, context, 'DELETE');
}