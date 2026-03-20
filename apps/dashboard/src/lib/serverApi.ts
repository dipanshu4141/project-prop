/**
 * apps/dashboard/src/lib/serverApi.ts
 *
 * Used by Next.js SERVER COMPONENTS only.
 * Reads the access_token cookie from the incoming request and
 * forwards it as a Bearer header so the NestJS backend can
 * authenticate the call.
 *
 * Never import this in "use client" components — use lib/api.ts instead.
 */

import { cookies } from 'next/headers';

const API_BASE = process.env.API_URL ?? 'http://localhost:3000/api';

async function getAuthHeader(): Promise<Record<string, string>> {
  const store = await cookies();
  const token = store.get('access_token')?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function serverGet<T>(path: string): Promise<T> {
  const auth = await getAuthHeader();

  const res = await fetch(`${API_BASE}${path}`, {
    method:  'GET',
    headers: { 'Content-Type': 'application/json', ...auth },
    cache:   'no-store',
  });

  if (!res.ok) {
    throw new Error(`serverGet ${path} failed (${res.status})`);
  }

  return res.json();
}

export async function serverPost<T>(path: string, body: unknown): Promise<T> {
  const auth = await getAuthHeader();

  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body:    JSON.stringify(body),
    cache:   'no-store',
  });

  if (!res.ok) {
    throw new Error(`serverPost ${path} failed (${res.status})`);
  }

  return res.json();
}