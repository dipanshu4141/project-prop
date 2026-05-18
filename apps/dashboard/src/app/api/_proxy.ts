import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL!;

export async function proxyRequest(
  req: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  const url = new URL(req.url);
  const fullUrl = `${BACKEND}${backendPath}${url.search}`;
  const cookie  = req.headers.get('cookie') ?? '';

  try {
    const res = await fetch(fullUrl, {
      method:  req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { cookie } : {}),
      },
      body: req.method !== 'GET' && req.method !== 'DELETE'
        ? await req.text()
        : undefined,
    });

    if (res.status === 204) return new NextResponse(null, { status: 204 });

    const text = await res.text();
    return new NextResponse(text || null, {
      status:  res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (err) {
    console.error(`Proxy error [${req.method} ${backendPath}]:`, err);
    return NextResponse.json({ error: 'PROXY_FAILED' }, { status: 502 });
  }
}