import { NextRequest, NextResponse } from "next/server";
const BACKEND_URL = process.env.BACKEND_URL!;

async function proxy(request: NextRequest, path: string) {
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/media/${path}${url.search}`;

  const res = await fetch(backendUrl, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || "",
    },
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.text(),
    cache: "no-store",
  });

  const data = await res.text();
  return new NextResponse(data, { status: res.status });
}

export async function GET(request: NextRequest) {
  return proxy(request, "usage");
}