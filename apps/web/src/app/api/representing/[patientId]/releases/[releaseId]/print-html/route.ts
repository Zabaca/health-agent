import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { patientDesignatedAgents, releases, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { decryptPii } from "@/lib/crypto";
import { buildReleaseHtml } from "@/lib/releases/release-print-html";

type Ctx = { params: Promise<{ patientId: string; releaseId: string }> };

// GET /api/representing/[patientId]/releases/[releaseId]/print-html — the same
// HIPAA release document the patient can export, but scoped to a PDA who is the
// authorized agent on the release. Authorizes via the accepted designated-agent
// relation (releasePermission) and the authAgentEmail === pda.email match used
// by the sibling detail route, then reuses the shared print-HTML builder.
export async function GET(req: NextRequest, { params }: Ctx) {
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

  const row = await db.query.releases.findFirst({
    where: and(eq(releases.id, releaseId), eq(releases.userId, patientId)),
    with: { providers: { orderBy: (p, { asc: a }) => [a(p.order)] } },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // PDA may only export releases where they are the authorized agent.
  if (row.authAgentEmail !== pda.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const release = decryptPii(row) as typeof row;
  const html = buildReleaseHtml(release as Parameters<typeof buildReleaseHtml>[0]);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
