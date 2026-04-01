import { NextRequest, NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import {
  patientDesignatedAgents,
  incomingFiles,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type FileWithRelations = Awaited<ReturnType<typeof db.query.incomingFiles.findMany<{
  with: { faxLog: true; uploadLog: { with: { uploadedBy: true } } };
}>>>[number];

async function fetchFiles(scope: 'all' | 'specific' | null, patientId: string, grantedIds: string[]): Promise<FileWithRelations[]> {
  if (scope === 'specific') {
    if (grantedIds.length === 0) return [];
    return db.query.incomingFiles.findMany({
      where: inArray(incomingFiles.id, grantedIds),
      with: { faxLog: true, uploadLog: { with: { uploadedBy: true } } },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    });
  }
  return db.query.incomingFiles.findMany({
    where: eq(incomingFiles.patientId, patientId),
    with: { faxLog: true, uploadLog: { with: { uploadedBy: true } } },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });
}

// GET /api/representing/[patientId]/records — fetch patient's files scoped by PDA grants
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { session, error } = await requireActiveSession();
  if (error) return error;

  const { patientId } = await params;

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, session.user.id),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
    with: { documentGrants: true },
  });

  if (!relation) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!relation.healthRecordsPermission) return NextResponse.json({ error: "No document access" }, { status: 403 });

  const grantedIds = relation.documentGrants.map(g => g.incomingFileId);
  const files = await fetchFiles(relation.healthRecordsScope, patientId, grantedIds);

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
