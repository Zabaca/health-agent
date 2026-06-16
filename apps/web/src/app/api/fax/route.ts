import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases, patientDesignatedAgents } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { sendReleaseFax } from "@/lib/fax/send-release-fax";

// Web fax endpoint (NextAuth cookie). Used by the in-app FaxButton across the
// patient, representing (PDA), admin, and agent views. The pages that render the
// button are role-gated, but that does NOT protect this API — any authenticated
// session can POST it directly — so we re-authorize the caller against the target
// release here. This matters doubly because `releaseId` is written to the
// releaseRequestLog, which is now surfaced on the release detail page: without
// this check a user could spoof fax-history onto someone else's release (and use
// the endpoint as an open fax gateway). Mobile callers use the scoped routes
// /api/releases/[id]/fax and /api/representing/[patientId]/releases/[id]/fax.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { faxNumber, fileData, fileName, releaseId, recipientName } = await req.json();
  if (typeof releaseId !== "string" || !releaseId) {
    return NextResponse.json({ error: "releaseId is required" }, { status: 400 });
  }

  const release = await db.query.releases.findFirst({
    where: eq(releases.id, releaseId),
    columns: { id: true, userId: true, authAgentEmail: true },
  });
  if (!release) return NextResponse.json({ error: "Release not found" }, { status: 404 });

  // Who may fax a release: staff (admin/agent) — any release; the patient — their
  // own; a PDA — a release they are the accepted authorized agent on. Mirrors the
  // guards on the scoped mobile fax routes.
  const u = session.user;
  const isStaff = u.type === "admin" || u.isAgent;
  const isOwner = release.userId === u.id;
  let isAgentOnRelease = false;
  if (!isStaff && !isOwner && u.email && release.authAgentEmail === u.email) {
    const relation = await db.query.patientDesignatedAgents.findFirst({
      where: and(
        eq(patientDesignatedAgents.agentUserId, u.id),
        eq(patientDesignatedAgents.patientId, release.userId),
        eq(patientDesignatedAgents.status, "accepted"),
      ),
      columns: { releasePermission: true },
    });
    isAgentOnRelease = !!relation?.releasePermission;
  }
  if (!isStaff && !isOwner && !isAgentOnRelease) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await sendReleaseFax({ faxNumber, fileData, fileName, releaseId, recipientName });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.rateLimited ? 429 : 400 });
  }
  return NextResponse.json({ success: true });
}
