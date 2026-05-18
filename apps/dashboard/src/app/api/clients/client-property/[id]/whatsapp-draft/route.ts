export const runtime = 'edge';
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET(req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const res = await fetch(
      `${BACKEND_URL}/api/clients/client-property/${id}/whatsapp-draft`,
      { cache: "no-store", headers: { cookie: req.headers.get("cookie") ?? "", authorization: req.headers.get("authorization") ?? "" } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch WhatsApp draft" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("🔥 WhatsApp draft API failed:", err);
    return NextResponse.json(
      { error: "WhatsApp draft API error" },
      { status: 500 }
    );
  }
}
