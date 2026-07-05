const API_BASE  = (process.env.NEXT_PUBLIC_API_URL ?? '') + '/api';
const AUTH_BASE = '/api';

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function drainQueue() {
  refreshQueue.forEach((fn) => fn());
  refreshQueue = [];
}

async function tryRefresh(): Promise<boolean> {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 600 * (i + 1)));
  }
  return false;
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const base = path.startsWith('/auth/') ? AUTH_BASE : API_BASE;
  const url  = `${base}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (res.ok) {
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as T);
  }

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
    if (refreshed) return api<T>(path, options);
    // Don't redirect — throw so caller can handle gracefully
    throw new Error('AUTH_EXPIRED');
  }

  if (res.status === 403) {
    const errorBody = await res.text().catch(() => '');
    let code = '';
    try {
      const parsed = JSON.parse(errorBody);
      const inner  = typeof parsed.message === 'string' ? JSON.parse(parsed.message) : parsed;
      code = inner.code ?? '';
    } catch {}
    if ((code === 'TRIAL_EXPIRED' || code === 'SUBSCRIPTION_REQUIRED') &&
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/v2/subscription')) {
      window.location.href = '/v2/subscription';
      throw new Error('Subscription required');
    }
  }

  const errorBody = await res.text().catch(() => '');
  let message = 'Something went wrong. Please try again.';
  try { message = JSON.parse(errorBody).message ?? message; } catch {}
  throw new Error(message);
}

export const apiGet   = <T>(path: string)                => api<T>(path, { method: 'GET'    });
export const apiPost  = <T>(path: string, body: unknown) => api<T>(path, { method: 'POST',  body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDel   = <T>(path: string)                => api<T>(path, { method: 'DELETE' });