export const runtime = 'edge';
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const res = await fetch(
      `${BACKEND_URL}/api/clients/client-property/${id}/whatsapp-sent`,
      { method: "POST" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to mark WhatsApp sent" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("🔥 WhatsApp sent API failed:", err);
    return NextResponse.json(
      { error: "WhatsApp sent API error" },
      { status: 500 }
    );
  }
}
