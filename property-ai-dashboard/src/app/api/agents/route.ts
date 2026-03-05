import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!; // server-only

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const res = await fetch(
      `${BACKEND_URL}/agents?${searchParams.toString()}`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          authorization: req.headers.get("authorization") ?? "",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch agents" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("API /agents error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
