import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { patientDesignatedAgents, releases, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { decryptPii } from "@/lib/crypto";

type Ctx = { params: Promise<{ patientId: string; releaseId: string }> };

async function resolveAccess(req: NextRequest, patientId: string) {
  const { result, error } = await resolveUserSession(req);
  if (error) return { error, result: null, relation: null, pda: null };

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, result.userId),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, "accepted"),
    ),
  });

  if (!relation || !relation.releasePermission) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), result: null, relation: null, pda: null };
  }

  const pda = await db.query.users.findFirst({
    where: eq(users.id, result.userId),
    columns: { email: true },
  });

  return { error: null, result, relation, pda };
}

// GET /api/representing/[patientId]/releases/[releaseId]
export async function GET(req: NextRequest, { params }: Ctx) {
  const { patientId, releaseId } = await params;
  const { error, pda } = await resolveAccess(req, patientId);
  if (error) return error;

  const release = await db.query.releases.findFirst({
    where: and(eq(releases.id, releaseId), eq(releases.userId, patientId)),
    with: { providers: { orderBy: (p, { asc }) => [asc(p.order)] } },
  });

  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify this PDA is the authorized agent for this release
  if (release.authAgentEmail && release.authAgentEmail !== pda?.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(decryptPii(release));
}

// DELETE /api/representing/[patientId]/releases/[releaseId] — void (editor only)
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { patientId, releaseId } = await params;
  const { error, relation, pda } = await resolveAccess(req, patientId);
  if (error) return error;

  if (relation!.releasePermission !== "editor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const release = await db.query.releases.findFirst({
    where: and(eq(releases.id, releaseId), eq(releases.userId, patientId)),
    columns: { id: true, voided: true, authAgentEmail: true },
  });

  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (release.voided) return NextResponse.json({ error: "Already voided" }, { status: 409 });
  if (release.authAgentEmail && release.authAgentEmail !== pda?.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .update(releases)
    .set({ voided: true, updatedAt: new Date().toISOString() })
    .where(eq(releases.id, releaseId));

  return NextResponse.json({ success: true });
}
