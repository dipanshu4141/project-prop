import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ FIX 1: await params
    const { id } = await context.params;

    const res = await fetch(
      `${BACKEND_URL}/clients/${id}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend error", status: res.status },
        { status: res.status }
      );
    }

    // ✅ FIX 2: normal JSON handling (no manual parsing)
    const data = await res.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error("🔥 API route crashed:", err);
    return NextResponse.json(
      { error: "API route failed" },
      { status: 500 }
    );
  }
}
