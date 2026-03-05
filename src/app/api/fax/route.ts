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
    tagname:           " ",
    tagnumber:         " ",
    callerid:          " ",
    url_notify:        process.env.FAXAGE_NOTIFY_URL!,
  });

  let status: "success" | "failed" | "awaiting_confirmation" = "failed";
  let apiResponse: string | null = null;
  let httpResponse: string | null = null;
  let isError = false;

  try {
    const res = await fetch(FAXAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    apiResponse = await res.text();
    httpResponse = JSON.stringify({
      status:     res.status,
      statusText: res.statusText,
      headers:    Object.fromEntries(res.headers.entries()),
      body:       apiResponse,
    });
    // Faxage always returns HTTP 200; detect errors by body prefix (ERRxx:)
    if (!res.ok || /^ERR\d+:/.test(apiResponse.trim())) {
      isError = true;
    } else if (apiResponse.trim().startsWith("JOBID:")) {
      status = "awaiting_confirmation";
    } else {
      // Unexpected body format — treat as error
      isError = true;
    }
  } catch (err) {
    isError = true;
    apiResponse = err instanceof Error ? err.message : String(err);
  }

  // Always log the attempt with the raw apiResponse and full HTTP response object
  await db.insert(releaseRequestLog).values({
    id:            crypto.randomUUID(),
    releaseId,
    type:          "fax",
    service:       "faxage",
    status,
    faxNumber,
    recipientName: recipientName ?? null,
    apiResponse,
    httpResponse,
    error:         isError,
    createdAt:     new Date().toISOString(),
  });

  if (status === "failed") {
    return NextResponse.json({ error: apiResponse }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
