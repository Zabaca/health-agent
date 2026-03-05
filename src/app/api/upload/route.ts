import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Transloadit } from "transloadit";
import { contract } from "@/lib/api/contract";
import { contractRoute } from "@/lib/api/contract-handler";

const client = new Transloadit({
  authKey: process.env.TRANSLOADIT_KEY!,
  authSecret: process.env.TRANSLOADIT_SECRET!,
});

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

    const assembly = await client.createAssembly({
      uploads: { [`file.${extension}`]: buffer },
      params: { steps: { ":original": { robot: "/upload/handle" } } } as any,
      waitForCompletion: true,
    });

    const url = (assembly as any).uploads?.[0]?.ssl_url;
    if (!url) {
      return NextResponse.json({ error: "Upload failed: no URL returned" }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
});
