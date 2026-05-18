export const runtime = 'edge';
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const res = await fetch(`${BACKEND_URL}/api/properties/${id}/leads`, {
      cache: "no-store",
      headers: {
        authorization: req.headers.get("authorization") ?? "",
        cookie: req.headers.get("cookie") ?? "",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("LEADS ERROR:", res.status, err);
      return NextResponse.json([], { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (e) {
    console.error("LEADS API CRASH:", e);
    return NextResponse.json([], { status: 500 });
  }
}
