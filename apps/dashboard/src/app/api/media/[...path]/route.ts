import { NextRequest, NextResponse } from "next/server";
const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/media/${path.join("/")}${url.search}`;

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_URL}/api/media/${path.join("/")}${url.search}`;

  const res = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || "",
    },
    body: await request.text(),
    cache: "no-store",
  });

  const data = await res.text();
  return new NextResponse(data, { status: res.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const backendUrl = `${BACKEND_URL}/api/media/${path.join("/")}`;

  const res = await fetch(backendUrl, {
    method: "DELETE",
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
    cache: "no-store",
  });

  const data = await res.text();
  return new NextResponse(data, { status: res.status });
}