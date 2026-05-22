import { NextRequest, NextResponse } from "next/server";
import { getFromR2 } from "@/lib/r2";
import { decryptBuffer } from "@/lib/crypto";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { incomingFiles, patientAssignments, patientDesignatedAgents } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { isZabacaAgent } from "@/lib/db/agent-role";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  // Look up the file record by matching fileURL suffix
  const file = await db.query.incomingFiles.findFirst({
    where: (f, { like }) => and(like(f.fileURL, `%${key}`), isNull(f.deletedAt)),
  });

  // File not tracked in DB (avatars, signatures, insurance cards, etc.) —
  // allow any authenticated user to access it
  if (!file) {
    return streamFile(key);
  }

  const userId = result.userId;

  // Admin can access any file — trust signed session for this check
  if (result.type === 'admin') {
    return streamFile(key, file.fileType);
  }

  // For agents and users, verify agent status from DB (source of truth for file access)
  const agentVerified = result.isAgent && await isZabacaAgent(userId);

  // File not assigned to a patient — only admin or verified agent may access
  if (!file.patientId) {
    if (agentVerified) return streamFile(key, file.fileType);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Patient (user) accessing their own file
  if (userId === file.patientId) {
    return streamFile(key, file.fileType);
  }

  // Agent with a patient assignment — DB-verified
  if (agentVerified) {
    const assignment = await db.query.patientAssignments.findFirst({
      where: and(
        eq(patientAssignments.patientId, file.patientId),
        eq(patientAssignments.assignedToId, userId),
      ),
    });
    if (assignment) return streamFile(key, file.fileType);
  }

  // PDA with accepted relationship and document permission
  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, userId),
      eq(patientDesignatedAgents.patientId, file.patientId),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
  });

  if (relation && relation.healthRecordsPermission) {
    return streamFile(key, file.fileType);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heic",
  tiff: "image/tiff",
  tif: "image/tiff",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  txt: "text/plain",
};

function mimeFromKey(key: string): string | undefined {
  const ext = key.split(".").pop()?.toLowerCase();
  return ext ? MIME_BY_EXT[ext] : undefined;
}

/**
 * Resolve a content-type. The DB's `fileType` is a bare extension ("pdf") for
 * fax/upload rows, or a full MIME ("application/fhir+json") elsewhere — map the
 * extension form to a real MIME so browsers inline-render instead of downloading.
 */
function toMime(t: string | undefined): string | undefined {
  if (!t) return undefined;
  if (t.includes("/")) return t;
  return MIME_BY_EXT[t.toLowerCase()];
}

async function streamFile(key: string, contentType?: string): Promise<NextResponse> {
  try {
    const obj = await getFromR2(key);
    if (!obj.Body) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Buffer + decrypt (GCM needs the whole object to verify the tag). Legacy
    // plaintext objects pass through decryptBuffer unchanged.
    const stored = Buffer.from(await obj.Body.transformToByteArray());
    const body = decryptBuffer(stored);

    const headers = new Headers();
    // Resolve a real MIME: DB type (ext→MIME) → key extension → the stored
    // object type (ignoring our opaque octet-stream) → octet-stream default.
    const objType = obj.ContentType && obj.ContentType !== "application/octet-stream" ? obj.ContentType : undefined;
    const ctype = toMime(contentType) ?? mimeFromKey(key) ?? objType ?? "application/octet-stream";
    headers.set("content-type", ctype);
    headers.set("cache-control", "private, no-cache");

    return new NextResponse(new Blob([new Uint8Array(body)]), { headers });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
