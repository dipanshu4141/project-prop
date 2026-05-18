export const runtime = 'edge';
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const res = await fetch(
    `${process.env.BACKEND_URL}/properties/leads/followups-today`,
    { cache: "no-store", headers: { cookie: req.headers.get("cookie") ?? "", authorization: req.headers.get("authorization") ?? "" } }
  );

  if (!res.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
