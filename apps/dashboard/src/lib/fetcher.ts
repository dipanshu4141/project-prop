export const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((r) => {
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    });