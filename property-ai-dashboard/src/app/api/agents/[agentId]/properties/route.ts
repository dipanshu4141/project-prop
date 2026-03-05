import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const url = new URL(req.url);
  const query = url.searchParams.toString();

  const res = await fetch(
    `${BACKEND_URL}/agents/${id}/properties?${query}`,
    { cache: "no-store" }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
