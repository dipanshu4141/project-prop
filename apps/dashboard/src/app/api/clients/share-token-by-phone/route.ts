export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;

export async function POST(req: NextRequest) {
  const res = await fetch(`${BACKEND_URL}/api/clients/share-token-by-phone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
    body: await req.text(),
  });
  return new NextResponse(await res.text(), { status: res.status });
}
