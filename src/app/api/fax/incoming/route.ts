import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incomingFaxLog, incomingFiles } from "@/lib/db/schema";
import { uploadToR2 } from "@/lib/r2";
import { eq } from "drizzle-orm";

const FAXAGE_URL = "https://api.faxage.com/httpsfax.php";
const FAX_FORMAT = "pdf";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.FAXAGE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse metadata from the POST body based on content-type
  const contentType = req.headers.get("content-type") ?? '';
  let fields: Record<string, string> = {};
  let rawBody: string | null = null;

  if (contentType.includes('application/json')) {
    const text = await req.text().catch(() => '');
    rawBody = text;
    try { fields = JSON.parse(text); } catch { fields = {}; }
  } else if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    const form = await req.formData().catch(() => new FormData());
    form.forEach((val, key) => {
      if (typeof val === 'string') fields[key] = val;
    });
    rawBody = JSON.stringify(fields);
  }

  const { recvid, recvdate, starttime, cid, dnis, pagecount, tsid } = fields;

  if (!recvid) {
    return NextResponse.json({ error: "Missing recvid" }, { status: 400 });
  }

  // Reuse existing log row if Faxage retries the same recvid
  let logId: string;
  const existing = await db.query.incomingFaxLog.findFirst({
    where: eq(incomingFaxLog.recvid, recvid),
  });

  if (existing) {
    logId = existing.id;
    // Already successfully retrieved — nothing to do
    if (existing.status === 'retrieved') return NextResponse.json({ ok: true });
  } else {
    logId = crypto.randomUUID();
    await db.insert(incomingFaxLog).values({
      id:        logId,
      recvid,
      recvdate:  recvdate  ?? '',
      starttime: starttime ?? '',
      cid:       cid       ?? null,
      dnis:      dnis      ?? null,
      pagecount: pagecount ? parseInt(pagecount) : null,
      tsid:      tsid      ?? null,
      status:    'pending',
      rawBody:   rawBody ?? null,
    });
  }

  // Retrieve the fax image from Faxage
  let faxRes: Response;
  try {
    faxRes = await fetch(FAXAGE_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username:  process.env.FAXAGE_USERNAME!,
        company:   process.env.FAXAGE_COMPANY!,
        password:  process.env.FAXAGE_PASSWORD!,
        operation: "getfax",
        faxid:     recvid,
        informat:  FAX_FORMAT,
      }).toString(),
    });
  } catch (err) {
    await db.update(incomingFaxLog).set({ status: 'failed' }).where(eq(incomingFaxLog.id, logId));
    return NextResponse.json({ ok: true });
  }

  const responseBuffer = await faxRes.arrayBuffer();
  const responseText   = Buffer.from(responseBuffer).toString('utf8', 0, Math.min(responseBuffer.byteLength, 128));

  // Faxage always returns HTTP 200 — detect errors by body content
  if (/^ERR\d+:/i.test(responseText.trim())) {
    await db.update(incomingFaxLog).set({ status: 'failed' }).where(eq(incomingFaxLog.id, logId));
    return NextResponse.json({ ok: true });
  }

  // Verify the response headers indicate a valid file attachment
  const faxContentType = faxRes.headers.get("content-type") ?? '';
  const disposition    = faxRes.headers.get("content-disposition") ?? '';

  if (
    !faxContentType.includes('application/octet-stream') ||
    !disposition.includes('attachment')
  ) {
    await db.update(incomingFaxLog).set({ status: 'failed' }).where(eq(incomingFaxLog.id, logId));
    return NextResponse.json({ ok: true });
  }

  // Extract filename from Content-Disposition header
  const filenameMatch = disposition.match(/filename="?([^";\s]+)"?/i);
  const originalFilename = filenameMatch?.[1] ?? `${recvid}.${FAX_FORMAT}`;

  const fileURL = await uploadToR2(Buffer.from(responseBuffer), originalFilename, "application/pdf").catch(() => null);
  if (!fileURL) {
    await db.update(incomingFaxLog).set({ status: 'failed' }).where(eq(incomingFaxLog.id, logId));
    return NextResponse.json({ ok: true });
  }

  await db.insert(incomingFiles).values({
    id:               crypto.randomUUID(),
    fileURL,
    fileType:         FAX_FORMAT,
    source:           'fax',
    incomingFaxLogId: logId,
    patientId:        null,
  });

  await db.update(incomingFaxLog)
    .set({ status: 'retrieved', filename: originalFilename })
    .where(eq(incomingFaxLog.id, logId));

  return NextResponse.json({ ok: true });
}
