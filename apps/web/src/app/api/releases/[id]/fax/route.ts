import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { releases } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { sendReleaseFax } from "@/lib/fax/send-release-fax";

// POST /api/releases/[id]/fax — fax one of the signed-in patient's own releases.
// Mobile (Bearer) counterpart to the web FaxButton; the PDF is rendered client
// side from the release print-html and posted here as base64.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { id } = await params;
  const release = await db.query.releases.findFirst({
    where: and(eq(releases.id, id), eq(releases.userId, result.userId)),
    columns: { id: true },
  });
  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { faxNumber, fileData, fileName, recipientName } = await req.json();
  const sent = await sendReleaseFax({ faxNumber, fileData, fileName, releaseId: id, recipientName });

  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
