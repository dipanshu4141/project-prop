// apps/dashboard/src/lib/serverApi.ts
import { cookies } from 'next/headers';

const NEXT_BASE = process.env.BACKEND_URL ?? 'http://localhost:3000';

function getCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  return cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
}

async function tryRefresh(cookieHeader: string): Promise<string | null> {
  try {
    const res = await fetch(`${NEXT_BASE}/api/auth/refresh`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    // Extract new access_token from Set-Cookie
    const setCookie = res.headers.get('set-cookie') ?? '';
    const match = setCookie.match(/access_token=([^;]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function serverGet<T = unknown>(path: string): Promise<T> {
  const url         = `${NEXT_BASE}/api${path}`;
  const cookieStore = await cookies();
  let cookieHeader  = getCookieHeader(cookieStore);

  let res = await fetch(url, {
    method:  'GET',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    cache:   'no-store',
  });

  // 401 — try refresh once then retry
  if (res.status === 401) {
    const newToken = await tryRefresh(cookieHeader);
    if (newToken) {
      // Replace access_token in cookie header
      cookieHeader = cookieHeader
        .replace(/access_token=[^;]+/, `access_token=${newToken}`)
        || `${cookieHeader}; access_token=${newToken}`;

      res = await fetch(url, {
        method:  'GET',
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        cache:   'no-store',
      });
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`serverGet ${path} failed: ${res.status} ${res.statusText} — ${body}`);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export async function serverPost<T = unknown>(
  path:   string,
  body:   unknown,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
): Promise<T> {
  const url         = `${NEXT_BASE}/api${path}`;
  const cookieStore = await cookies();
  let cookieHeader  = getCookieHeader(cookieStore);

  let res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body:    JSON.stringify(body),
    cache:   'no-store',
  });

  // 401 — try refresh once then retry
  if (res.status === 401) {
    const newToken = await tryRefresh(cookieHeader);
    if (newToken) {
      cookieHeader = cookieHeader
        .replace(/access_token=[^;]+/, `access_token=${newToken}`)
        || `${cookieHeader}; access_token=${newToken}`;

      res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
        body:    JSON.stringify(body),
        cache:   'no-store',
      });
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`serverPost ${method} ${path} failed: ${res.status} ${res.statusText} — ${body}`);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}