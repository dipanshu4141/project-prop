export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/team/members`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || '',
      },
    });
    const data = await res.json();
    const items = data?.items || data?.data || data?.team || data?.members || (Array.isArray(data) ? data : []);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('TEAM API ERROR:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
