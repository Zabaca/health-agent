import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { uploadToR2 } from "@/lib/r2";

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "image/tiff",
  "application/pdf",
  "application/zip",
];

export async function POST(req: NextRequest) {
  const { error } = await resolveUserSession(req);
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

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "File type not allowed. Supported: images, PDF, TIFF, ZIP" },
        { status: 400 }
      );
    }

    const url = await uploadToR2(buffer, filename, mimeType);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
