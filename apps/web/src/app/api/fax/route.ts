import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendReleaseFax } from "@/lib/fax/send-release-fax";

// Web fax endpoint (NextAuth cookie). Used by the in-app FaxButton across the
// patient, representing (PDA), admin, and agent views — page-level access
// control gates who can reach it. Mobile callers use the scoped routes
// /api/releases/[id]/fax and /api/representing/[patientId]/releases/[id]/fax.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { faxNumber, fileData, fileName, releaseId, recipientName } = await req.json();
  const result = await sendReleaseFax({ faxNumber, fileData, fileName, releaseId, recipientName });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
