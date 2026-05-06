import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(req: Request,
  context: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await context.params;

  const url = new URL(req.url);
  const query = url.searchParams.toString();

  const res = await fetch(
    `${BACKEND_URL}/agents/${agentId}/properties?${query}`,
    { cache: "no-store", headers: { cookie: req.headers.get("cookie") ?? "", authorization: req.headers.get("authorization") ?? "" } }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
