import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/team`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { items: [] },
        { status: res.status }
      );
    }

    const data = await res.json();

    /**
     * Normalize response so frontend ALWAYS gets an array
     */
    const items =
      data?.items ||
      data?.data ||
      data?.team ||
      data?.members ||
      (Array.isArray(data) ? data : []);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("TEAM API ERROR:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
