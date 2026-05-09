import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(`${BACKEND_URL}/api/properties/${id}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
    body: await req.text(),
  });
  return new NextResponse(await res.text(), { status: res.status });
}
