/**
 * apps/dashboard/src/lib/api.ts
 *
 * Thin fetch wrapper that:
 *  - Always sends cookies (credentials: 'include')
 *  - On 401, silently calls /auth/refresh and retries once
 *  - On second 401, redirects to /login
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api';

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function drainQueue() {
  refreshQueue.forEach((fn) => fn());
  refreshQueue = [];
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function api<T = any>(
  path:    string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',    // always send cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Happy path
  if (res.ok) {
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as T);
  }

  // 401 — try to refresh once
  if (res.status === 401) {
    if (isRefreshing) {
      // Queue this request until refresh completes
      await new Promise<void>((resolve) => refreshQueue.push(resolve));
      return api<T>(path, options);
    }

    isRefreshing = true;
    const refreshed = await tryRefresh();
    isRefreshing = false;
    drainQueue();

    if (refreshed) {
      // Retry original request with new cookies
      return api<T>(path, options);
    }

    // Refresh failed — session is dead, redirect to login
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
    }
    throw new Error('Session expired');
  }

  // Other error — parse and throw
  const errorBody = await res.text().catch(() => '');
  let message = `API error ${res.status}`;
  try {
    const parsed = JSON.parse(errorBody);
    message = parsed.message ?? message;
  } catch {}
  throw new Error(message);
}

/* ── Convenience wrappers ── */

export const apiGet  = <T>(path: string)                => api<T>(path, { method: 'GET' });
export const apiPost = <T>(path: string, body: unknown)  => api<T>(path, { method: 'POST',  body: JSON.stringify(body) });
export const apiPatch= <T>(path: string, body: unknown)  => api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDel  = <T>(path: string)                => api<T>(path, { method: 'DELETE' });