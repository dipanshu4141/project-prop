export const runtime = 'edge';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(
  req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const res = await fetch(`${BACKEND_URL}/api/public/share/${token}`, {
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}