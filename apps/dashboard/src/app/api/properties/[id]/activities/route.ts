import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const res = await fetch(
      `${BACKEND_URL}/properties/${id}/activities`,
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
      console.error("ACTIVITIES ERROR:", res.status, err);
      return NextResponse.json([], { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (e) {
    console.error("ACTIVITIES API CRASH:", e);
    return NextResponse.json([], { status: 500 });
  }
}
