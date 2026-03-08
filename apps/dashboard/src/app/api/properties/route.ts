import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const backendUrl = `http://localhost:3000/properties${url.search}`;

  const res = await fetch(backendUrl, {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data);
}
