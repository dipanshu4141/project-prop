import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
    console.log("🧪 BACKEND_URL =", process.env.BACKEND_URL);
    try {
      console.log("🧪 BACKEND_URL =", process.env.BACKEND_URL);
    const { id } = await context.params; // ✅ THIS IS THE FIX
    const body = await req.json();

    const backendUrl = `${process.env.BACKEND_URL}/properties/${id}/share`;


    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("API FORWARD ERROR", err);
    return NextResponse.json(
      { error: "Failed to forward property share" },
      { status: 500 }
    );
  }
}
