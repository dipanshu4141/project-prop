export const runtime = 'edge';
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const url = new URL(req.url);
    const query = url.searchParams.toString();

    const res = await fetch(
      `${BACKEND_URL}/api/properties/${id}/neighbors?${query}`,
      {
        cache: "no-store",
        headers: {
          authorization: req.headers.get("authorization") ?? "",
          cookie: req.headers.get("cookie") ?? "",
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("NEIGHBORS ERROR:", res.status, err);
      return NextResponse.json({ prevId: null, nextId: null });
    }

    return NextResponse.json(await res.json());
  } catch (e) {
    console.error("NEIGHBORS API CRASH:", e);
    return NextResponse.json({ prevId: null, nextId: null });
  }
}