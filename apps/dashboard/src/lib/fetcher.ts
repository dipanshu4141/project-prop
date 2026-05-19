// apps/dashboard/src/lib/fetcher.ts
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '') + '/api';

export const fetcher = (url: string) =>
  fetch(url.startsWith('/api') || url.startsWith('http') ? url : `${API_BASE}${url}`, {
    credentials: 'include',
  }).then((r) => {
    if (!r.ok) throw new Error('fetch failed');
    return r.json();
  });