export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const res = await fetch(`${BACKEND_URL}/api/deals${url.search}`, {
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || "",
    },
    cache: "no-store",
  });
  return new NextResponse(await res.text(), { status: res.status });
}

export async function POST(request: NextRequest) {
  const res = await fetch(`${BACKEND_URL}/api/deals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || "",
    },
    body: await request.text(),
  });
  return new NextResponse(await res.text(), { status: res.status });
}
