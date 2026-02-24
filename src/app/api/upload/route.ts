import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveFile } from "@/lib/upload";
import { contract } from "@/lib/api/contract";
import { contractRoute } from "@/lib/api/contract-handler";

export const POST = contractRoute(contract.upload, async ({ body, req }) => {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, extension = "png" } = body;

  if (!data) {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
  }

  try {
    const url = await saveFile(data, extension);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
});
