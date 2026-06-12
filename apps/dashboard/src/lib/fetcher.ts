// apps/dashboard/src/lib/fetcher.ts
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '') + '/api';

export const fetcher = (url: string) =>
  fetch(url.startsWith('/api') || url.startsWith('http') ? url : `${API_BASE}${url}`, {
    credentials: 'include',
  }).then(async (r) => {
    if (r.status === 403) {
      const body = await r.json().catch(() => ({}));
      if (body.code === 'TRIAL_EXPIRED' || body.code === 'SUBSCRIPTION_REQUIRED') {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/v2/subscription')) {
          window.location.href = '/v2/subscription';
        }
      }
      throw new Error('Subscription required');
    }
    if (!r.ok) throw new Error('fetch failed');
    return r.json();
  });