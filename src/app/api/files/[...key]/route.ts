import { NextRequest, NextResponse } from "next/server";
import { getFromR2 } from "@/lib/r2";

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string[] } },
) {
  const key = params.key.join("/");

  try {
    const obj = await getFromR2(key);
    if (!obj.Body) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const headers = new Headers();
    if (obj.ContentType) headers.set("content-type", obj.ContentType);
    headers.set("cache-control", "public, max-age=31536000, immutable");

    const stream = obj.Body.transformToWebStream();
    return new NextResponse(stream, { headers });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
