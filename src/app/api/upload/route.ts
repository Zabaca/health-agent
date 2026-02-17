import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveFile } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = file.name.split(".").pop() || "png";
      const url = await saveFile(buffer, ext);

      return NextResponse.json({ url });
    } else {
      // JSON body with base64
      const body = await req.json();
      const { data, extension = "png" } = body;

      if (!data) {
        return NextResponse.json({ error: "No data provided" }, { status: 400 });
      }

      const url = await saveFile(data, extension);
      return NextResponse.json({ url });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
