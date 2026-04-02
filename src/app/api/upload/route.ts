import { NextRequest, NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const { error } = await requireActiveSession();
  if (error) return error;

  const contentType = req.headers.get("content-type") ?? "";

  try {
    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      buffer = Buffer.from(await file.arrayBuffer());
      filename = file.name || "upload";
      mimeType = file.type || "application/octet-stream";
    } else {
      const body = await req.json() as { data: string; extension?: string };
      const { data, extension = "png" } = body;
      if (!data) {
        return NextResponse.json({ error: "No data provided" }, { status: 400 });
      }
      buffer = Buffer.from(data.replace(/^data:[^;]+;base64,/, ""), "base64");
      filename = `file.${extension}`;
      const match = data.match(/^data:([^;]+);/);
      mimeType = match?.[1] ?? "application/octet-stream";
    }

    const url = await uploadToR2(buffer, filename, mimeType);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
