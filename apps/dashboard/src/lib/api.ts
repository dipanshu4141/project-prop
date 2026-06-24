/**
 * apps/dashboard/src/lib/api.ts
 *
 * Thin fetch wrapper that:
 *  - Always sends cookies (credentials: 'include')
 *  - Auth routes (/auth/*) always go through Next.js proxy for cookie handling
 *  - Data routes go direct to Railway via NEXT_PUBLIC_API_URL for speed
 *  - On 401, silently calls /auth/refresh and retries once
 *  - On second 401, redirects to /login
 */

// Direct to Railway — fast, for all data calls
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '') + '/api';

// Always through Next.js proxy — for auth cookie setting/clearing
const AUTH_BASE = '/api';

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function drainQueue() {
  refreshQueue.forEach((fn) => fn());
  refreshQueue = [];
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', {
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
    const base = path.startsWith('/auth/') ? AUTH_BASE : API_BASE;
    const url  = `${base}${path}`;

    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (res.ok) {
      const text = await res.text();
      return text ? JSON.parse(text) : (undefined as T);
    }

    // 401 on login/register itself — this is a credentials error, NOT a session expiry.
    // Pass the real backend message through.
    const isAuthEndpoint = path === '/auth/login' || path === '/auth/register' || path === '/auth/register-member';

    if (res.status === 401 && !isAuthEndpoint) {
      if (isRefreshing) {
        await new Promise<void>((resolve) => refreshQueue.push(resolve));
        return api<T>(path, options);
      }
      isRefreshing = true;
      const refreshed = await tryRefresh();
      isRefreshing = false;
      drainQueue();
      if (refreshed) {
        return api<T>(path, options);
      }
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }

    if (res.status === 403) {
      const errorBody = await res.text().catch(() => '');
      let code = '';
      try {
        const parsed = JSON.parse(errorBody);
        const inner = typeof parsed.message === 'string'
          ? JSON.parse(parsed.message)
          : parsed;
        code = inner.code ?? '';
      } catch {}
      if (
        (code === 'TRIAL_EXPIRED' || code === 'SUBSCRIPTION_REQUIRED') &&
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/v2/subscription')
      ) {
        window.location.href = '/v2/subscription';
        throw new Error('Subscription required');
      }
    }

    // All other errors (400, 401 on auth endpoints, 409, 500, etc.) — surface real backend message
    const errorBody = await res.text().catch(() => '');
    let message = `Something went wrong. Please try again.`;
    try {
      const parsed = JSON.parse(errorBody);
      message = parsed.message ?? message;
    } catch {}
    throw new Error(message);
  }

/* ── Convenience wrappers ── */
export const apiGet   = <T>(path: string)               => api<T>(path, { method: 'GET'    });
export const apiPost  = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST',  body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDel   = <T>(path: string)               => api<T>(path, { method: 'DELETE' });