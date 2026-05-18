export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    console.log('🍪 cookie being forwarded:', req.headers.get('cookie'));
    const res = await fetch(
      `${BACKEND_URL}/api/clients/client-property/${id}/follow-up`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: (req as any).headers.get?.('cookie') ?? req.headers.get?.('cookie') ?? '',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("🔥 Follow-up API failed:", err);
    return NextResponse.json(
      { error: "Failed to update follow-up" },
      { status: 500 }
    );
  }
}
