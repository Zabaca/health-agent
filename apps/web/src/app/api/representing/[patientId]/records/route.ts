import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import {
  patientDesignatedAgents,
  incomingFiles,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// GET /api/representing/[patientId]/records — fetch patient's files scoped by PDA grants
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { patientId } = await params;

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, result.userId),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
  });

  if (!relation) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!relation.healthRecordsPermission) return NextResponse.json({ error: "No document access" }, { status: 403 });

  const files = await db.query.incomingFiles.findMany({
    where: and(eq(incomingFiles.patientId, patientId), isNull(incomingFiles.deletedAt)),
    with: { faxLog: true, uploadLog: { with: { uploadedBy: true } } },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });

  return NextResponse.json({
    files: files.map(f => ({
      id: f.id,
      fileURL: f.fileURL,
      fileType: f.fileType,
      source: f.source,
      createdAt: f.createdAt,
      pagecount: f.faxLog?.pagecount ?? null,
      originalName: f.uploadLog?.originalName ?? null,
      uploadedBy: f.uploadLog?.uploadedBy
        ? { id: f.uploadLog.uploadedBy.id, firstName: f.uploadLog.uploadedBy.firstName, lastName: f.uploadLog.uploadedBy.lastName }
        : null,
    })),
    permission: relation.healthRecordsPermission,
    canUpload: relation.healthRecordsPermission === 'editor',
  });
}
