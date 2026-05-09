import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/properties${url.search}`;

  const res = await fetch(backendUrl, {
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || "",
    },
    cache: "no-store",
  });

  const data = await res.text();
  return new NextResponse(data, { status: res.status });
}
