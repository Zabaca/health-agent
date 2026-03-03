import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releaseRequestLog } from "@/lib/db/schema";

const FAXAGE_URL = "https://api.faxage.com/httpsfax.php";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { faxNumber, fileData, fileName, releaseId, recipientName } = await req.json();

  const params = new URLSearchParams({
    username:          process.env.FAXAGE_USERNAME!,
    company:           process.env.FAXAGE_COMPANY!,
    password:          process.env.FAXAGE_PASSWORD!,
    operation:         "sendfax",
    faxno:             faxNumber,
    recipname:         recipientName ?? "Medical Records",
    "faxfilenames[0]": fileName,
    "faxfiledata[0]":  fileData,
  });

  let status: "success" | "failed" = "failed";
  let apiResponse: string | null = null;
  let isError = false;

  try {
    const res = await fetch(FAXAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    apiResponse = await res.text();
    // Faxage returns "JOBID\n<id>" on success, "ERROR\n<detail>" on failure
    if (apiResponse.startsWith("ERROR")) {
      isError = true;
    } else {
      status = "success";
    }
  } catch (err) {
    isError = true;
    apiResponse = err instanceof Error ? err.message : String(err);
  }

  // Always log the attempt with the raw apiResponse
  await db.insert(releaseRequestLog).values({
    id:            crypto.randomUUID(),
    releaseId,
    type:          "fax",
    service:       "faxage",
    status,
    faxNumber,
    recipientName: recipientName ?? null,
    apiResponse,
    error:         isError,
    createdAt:     new Date().toISOString(),
  });

  if (status === "failed") {
    return NextResponse.json({ error: apiResponse }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
