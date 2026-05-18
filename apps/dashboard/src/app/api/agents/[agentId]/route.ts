export const runtime = 'edge';
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(req: Request,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    // ✅ App Router: params must be awaited
    const { agentId } = await context.params;

    const res = await fetch(
      `${BACKEND_URL}/agents/${agentId}`,
      { cache: "no-store", headers: { cookie: req.headers.get("cookie") ?? "", authorization: req.headers.get("authorization") ?? "" } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend error", status: res.status },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error("🔥 API /agents/[id] crashed:", err);
    return NextResponse.json(
      { error: "API route failed" },
      { status: 500 }
    );
  }
}
