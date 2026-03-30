import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, patientDesignatedAgentDocumentGrants, incomingFiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// PATCH /api/my-designated-agents/[id]/documents — set specific document grants
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.type === 'admin' || session.user.isAgent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const record = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.id, id),
      eq(patientDesignatedAgents.patientId, session.user.id)
    ),
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { fileIds: string[] };
  if (!Array.isArray(body.fileIds)) {
    return NextResponse.json({ error: "fileIds must be an array" }, { status: 400 });
  }

  // Verify all files belong to this patient
  const patientFiles = await db.query.incomingFiles.findMany({
    where: eq(incomingFiles.patientId, session.user.id),
  });
  const patientFileIds = new Set(patientFiles.map(f => f.id));
  const invalid = body.fileIds.filter(fid => !patientFileIds.has(fid));
  if (invalid.length > 0) {
    return NextResponse.json({ error: "Some file IDs do not belong to this patient" }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(patientDesignatedAgentDocumentGrants)
      .where(eq(patientDesignatedAgentDocumentGrants.patientDesignatedAgentRelationId, id));

    if (body.fileIds.length > 0) {
      await tx.insert(patientDesignatedAgentDocumentGrants).values(
        body.fileIds.map(fileId => ({
          id: randomUUID(),
          patientDesignatedAgentRelationId: id,
          incomingFileId: fileId,
        }))
      );
    }
  });

  return NextResponse.json({ success: true });
}
