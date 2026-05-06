import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const res = await fetch(`${BACKEND_URL}/api/clients/${id}`, {
      cache: "no-store",
      headers: {
        cookie:        req.headers.get("cookie") ?? "",
        authorization: req.headers.get("authorization") ?? "",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (err) {
    console.error("🔥 API route crashed:", err);
    return NextResponse.json({ error: "API route failed" }, { status: 500 });
  }
}