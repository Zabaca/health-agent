import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getConfiguration } from "@/lib/config";
import { faxConfirm, releaseRequestLog } from "@/lib/db/schema";
import { like } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { FAXAGE_WEBHOOK_SECRET } = getConfiguration();
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== FAXAGE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let fields: Record<string, string> = {};
  let rawBody: string | null = null;

  if (contentType.includes("application/json")) {
    const text = await req.text().catch(() => "");
    rawBody = text;
    try { fields = JSON.parse(text); } catch { fields = {}; }
  } else if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const form = await req.formData().catch(() => new FormData());
    form.forEach((val, key) => {
      if (typeof val === "string") fields[key] = val;
    });
    rawBody = JSON.stringify(fields);
  }

  const { jobid, commid, destname, destnum, shortstatus, longstatus, sendtime, completetime } = fields;

  await db.insert(faxConfirm).values({
    id:           crypto.randomUUID(),
    jobid:        jobid        ?? null,
    commid:       commid       ?? null,
    destname:     destname     ?? null,
    destnum:      destnum      ?? null,
    shortstatus:  shortstatus  ?? null,
    longstatus:   longstatus   ?? null,
    sendtime:     sendtime     ?? null,
    completetime: completetime ?? null,
    rawBody:      rawBody      ?? null,
  });

  if (jobid && shortstatus) {
    await db
      .update(releaseRequestLog)
      .set({ status: shortstatus as "success" | "failed" | "awaiting_confirmation" })
      .where(like(releaseRequestLog.apiResponse, `JOBID: ${jobid}%`));
  }

  return NextResponse.json({ ok: true });
}
