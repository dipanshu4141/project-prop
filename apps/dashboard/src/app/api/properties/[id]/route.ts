import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;

/* ------------------------------------------------ */
/* GET PROPERTY */
/* ------------------------------------------------ */

export async function GET(req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const res = await fetch(`${BACKEND_URL}/api/properties/${id}`, {
      cache: "no-store",
      headers: {
        authorization: req.headers.get("authorization") ?? "",
        cookie: req.headers.get("cookie") ?? "",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("PROPERTY GET ERROR:", res.status, err);
      return NextResponse.json({ error: "Failed" }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (e) {
    console.error("PROPERTY GET CRASH:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ------------------------------------------------ */
/* PATCH PROPERTY (🔥 THIS WAS MISSING) */
/* ------------------------------------------------ */

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/api/properties/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        authorization: req.headers.get("authorization") ?? "",
        cookie: req.headers.get("cookie") ?? "",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("PROPERTY PATCH ERROR:", res.status, err);
      return NextResponse.json(
        { error: "Failed to update property" },
        { status: res.status }
      );
    }

    return NextResponse.json(await res.json());
  } catch (e) {
    console.error("PROPERTY PATCH CRASH:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
