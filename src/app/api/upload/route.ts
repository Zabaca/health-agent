import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { contract } from "@/lib/api/contract";
import { contractRoute } from "@/lib/api/contract-handler";
import { uploadBufferToTransloadit } from "@/lib/transloadit";

export const POST = contractRoute(contract.upload, async ({ body }) => {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, extension = "png" } = body;

  if (!data) {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
  }

  try {
    const base64 = data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    const url = await uploadBufferToTransloadit(buffer, `file.${extension}`);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
});
