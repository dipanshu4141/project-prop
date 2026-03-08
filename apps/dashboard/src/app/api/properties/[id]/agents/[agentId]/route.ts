import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function DELETE(
  _req: NextRequest,
  context: {
    params: Promise<{
      id: string;
      agentId: string;
    }>;
  }
) {
  const { id, agentId } = await context.params; // ✅ REQUIRED

  console.log("DETACH PROXY HIT", { id, agentId });

  const res = await fetch(
    `${BACKEND_URL}/properties/${id}/agents/${agentId}`,
    {
      method: "DELETE",
    }
  );

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
