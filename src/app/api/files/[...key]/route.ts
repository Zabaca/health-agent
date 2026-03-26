import { NextRequest, NextResponse } from "next/server";
import { getFromR2 } from "@/lib/r2";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles, patientAssignments, patientDesignatedAgents, patientDesignatedAgentDocumentGrants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  // Look up the file record by matching fileURL suffix
  const file = await db.query.incomingFiles.findFirst({
    where: (f, { like }) => like(f.fileURL, `%${key}`),
  });

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const userType = session.user.type;

  // Admin can access any file
  if (userType === 'admin') {
    return streamFile(key, file.fileType);
  }

  // File not assigned to a patient — only admin or assigned agent may access
  if (!file.patientId) {
    if (userType === 'agent') {
      return streamFile(key, file.fileType);
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Patient accessing their own file
  if (userId === file.patientId) {
    return streamFile(key, file.fileType);
  }

  // Agent with assignment
  if (userType === 'agent') {
    const assignment = await db.query.patientAssignments.findFirst({
      where: and(
        eq(patientAssignments.patientId, file.patientId),
        eq(patientAssignments.assignedToId, userId),
      ),
    });
    if (assignment) return streamFile(key, file.fileType);
  }

  // PDA with accepted relationship
  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, userId),
      eq(patientDesignatedAgents.patientId, file.patientId),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
  });

  if (relation && relation.documentPermission) {
    if (relation.documentScope === 'all') {
      return streamFile(key, file.fileType);
    }
    if (relation.documentScope === 'specific') {
      const grant = await db.query.patientDesignatedAgentDocumentGrants.findFirst({
        where: and(
          eq(patientDesignatedAgentDocumentGrants.patientDesignatedAgentRelationId, relation.id),
          eq(patientDesignatedAgentDocumentGrants.incomingFileId, file.id),
        ),
      });
      if (grant) return streamFile(key, file.fileType);
    }
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function streamFile(key: string, contentType?: string): Promise<NextResponse> {
  try {
    const obj = await getFromR2(key);
    if (!obj.Body) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const headers = new Headers();
    if (obj.ContentType) headers.set("content-type", obj.ContentType);
    else if (contentType) headers.set("content-type", contentType);
    headers.set("cache-control", "private, no-cache");

    const stream = obj.Body.transformToWebStream();
    return new NextResponse(stream, { headers });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
