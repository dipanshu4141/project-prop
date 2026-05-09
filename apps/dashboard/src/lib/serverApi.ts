// apps/dashboard/src/lib/serverApi.ts
//
// Server-side fetch utility for Next.js Server Components.
//
// Calls through the Next.js proxy routes (/api/admin/...) rather than
// hitting NestJS directly. The proxy forwards the cookie to NestJS.
// This is consistent with how every other backend call works in this project.

import { cookies } from 'next/headers';

// Internal Next.js base URL — server calling its own proxy routes
const NEXT_BASE =
  process.env.BACKEND_URL ??
  'http://localhost:3000';

/**
 * GET from a server component.
 * Calls /api/<path> on the Next.js server (which proxies to NestJS).
 * Forwards the access_token cookie so the proxy can pass it to NestJS.
 * Throws on non-2xx so callers can catch and call notFound() / redirect().
 */
export async function serverGet<T = unknown>(path: string): Promise<T> {
  // path is e.g. "/admin/properties?limit=20"
  // → becomes  "http://localhost:3000/api/admin/properties?limit=20"
  const url = `${NEXT_BASE}/api${path}`;

  // Read the incoming request's cookies so we can forward auth
  const cookieStore = await cookies();
  const allCookies  = cookieStore.getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const res = await fetch(url, {
    method:  'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(allCookies ? { cookie: allCookies } : {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `serverGet ${path} failed: ${res.status} ${res.statusText} — ${body}`,
    );
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

/**
 * POST/PATCH/DELETE from a server action.
 * Same cookie-forwarding pattern as serverGet.
 */
export async function serverPost<T = unknown>(
  path:   string,
  body:   unknown,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
): Promise<T> {
  const url = `${NEXT_BASE}/api${path}`;

  const cookieStore = await cookies();
  const allCookies  = cookieStore.getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(allCookies ? { cookie: allCookies } : {}),
    },
    body:  JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `serverPost ${method} ${path} failed: ${res.status} ${res.statusText} — ${body}`,
    );
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}