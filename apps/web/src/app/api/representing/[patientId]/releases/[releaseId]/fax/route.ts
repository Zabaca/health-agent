import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { patientDesignatedAgents, releases, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { sendReleaseFax } from "@/lib/fax/send-release-fax";

type Ctx = { params: Promise<{ patientId: string; releaseId: string }> };

// POST /api/representing/[patientId]/releases/[releaseId]/fax — a PDA faxes a
// release they are the authorized agent on. Same guard as the sibling print-html
// + detail routes (accepted relation + authAgentEmail match); PDF is rendered
// client side from the PDA-scoped print-html and posted here as base64.
export async function POST(req: NextRequest, { params }: Ctx) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { patientId, releaseId } = await params;

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, result.userId),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, "accepted"),
    ),
  });
  if (!relation || !relation.releasePermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pda = await db.query.users.findFirst({
    where: eq(users.id, result.userId),
    columns: { email: true },
  });
  if (!pda?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const release = await db.query.releases.findFirst({
    where: and(eq(releases.id, releaseId), eq(releases.userId, patientId)),
    columns: { id: true, authAgentEmail: true },
  });
  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (release.authAgentEmail !== pda.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { faxNumber, fileData, fileName, recipientName } = await req.json();
  const sent = await sendReleaseFax({ faxNumber, fileData, fileName, releaseId, recipientName });

  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
