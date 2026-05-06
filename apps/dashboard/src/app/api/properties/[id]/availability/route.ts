import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    // Forward cookies so JwtAuthGuard on the NestJS side sees the session
    const cookie = req.headers.get("cookie") ?? "";

    const res = await fetch(
      `${BACKEND_URL}/api/properties/${id}/availability`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.text();

    return new NextResponse(data, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("AVAILABILITY PROXY ERROR:", err);
    return NextResponse.json(
      { error: "AVAILABILITY_PROXY_FAILED" },
      { status: 500 }
    );
  }
}