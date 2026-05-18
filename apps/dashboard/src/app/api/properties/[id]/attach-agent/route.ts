export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ THIS WAS MISSING
    const body = await req.json();

    console.log("PROXY PROPERTY ID:", id);
    console.log("PROXY BODY:", body);
    console.log(
      "FORWARDING TO:",
      `${BACKEND_URL}/api/properties/${id}/attach-agent`
    );

    const res = await fetch(
      `${BACKEND_URL}/api/properties/${id}/attach-agent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.text();

    return new NextResponse(data, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("ATTACH AGENT PROXY ERROR:", err);
    return NextResponse.json(
      { error: "ATTACH_AGENT_PROXY_FAILED" },
      { status: 500 }
    );
  }
}
