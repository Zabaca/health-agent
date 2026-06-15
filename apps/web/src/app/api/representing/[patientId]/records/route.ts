import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import {
  patientDesignatedAgents,
  incomingFiles,
  RECORD_VISIBLE_SOURCES,
} from "@/lib/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";

const FHIR_SOURCE = "healthkitFHIR";

type Reference = { display?: string; actor?: { display?: string } };

/** Best-effort source name from a FHIR resource (lab/clinic that produced it).
 *  Mirrors the same helper in /api/my-records so PDA + patient lists agree. */
function fhirSourceName(fhirData: unknown): string | null {
  if (!fhirData || typeof fhirData !== "object") return null;
  const d = fhirData as Record<string, unknown>;
  const p0 = (d.performer as Reference[] | undefined)?.[0];
  const candidate =
    p0?.display ??
    p0?.actor?.display ??
    (d.recorder as Reference | undefined)?.display ??
    (d.asserter as Reference | undefined)?.display ??
    (d.informationSource as Reference | undefined)?.display ??
    (d.requester as Reference | undefined)?.display ??
    null;
  return candidate && candidate.trim().length > 0 ? candidate : null;
}

/** Pull just the list display fields out of the encrypted FHIR blob. fhirData
 *  is excluded to keep payloads small — the detail endpoint returns it. */
function fhirSummary(blob: string | null): {
  displayName: string | null;
  recordType: string | null;
  source: string | null;
} {
  if (!blob) return { displayName: null, recordType: null, source: null };
  try {
    const parsed = JSON.parse(decrypt(blob)) as {
      displayName?: string | null;
      recordType?: string | null;
      sourceName?: string | null;
      fhirData?: unknown;
    };
    return {
      displayName: parsed.displayName ?? null,
      recordType: parsed.recordType ?? null,
      source: parsed.sourceName ?? fhirSourceName(parsed.fhirData),
    };
  } catch {
    return { displayName: null, recordType: null, source: null };
  }
}

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
    where: and(eq(incomingFiles.patientId, patientId), isNull(incomingFiles.deletedAt), inArray(incomingFiles.source, [...RECORD_VISIBLE_SOURCES])),
    with: { faxLog: true, uploadLog: { with: { uploadedBy: true } } },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });

  return NextResponse.json({
    files: files.map(f => {
      // FHIR clinical rows carry their display info in the encrypted dataBlob;
      // surface the same fields the patient list (/api/my-records) exposes so the
      // PDA records list can label, group, and route them identically.
      const isFhir = f.source === FHIR_SOURCE;
      const summary = isFhir
        ? fhirSummary(f.dataBlob)
        : { displayName: null, recordType: null, source: null };
      return {
        id: f.id,
        fileURL: f.fileURL,
        fileType: f.fileType,
        source: f.source,
        createdAt: f.createdAt,
        userProviderId: f.userProviderId ?? null,
        pagecount: f.faxLog?.pagecount ?? null,
        originalName: f.uploadLog?.originalName ?? null,
        uploadedBy: f.uploadLog?.uploadedBy
          ? { id: f.uploadLog.uploadedBy.id, firstName: f.uploadLog.uploadedBy.firstName, lastName: f.uploadLog.uploadedBy.lastName }
          : null,
        // FHIR-only fields (null for documents).
        type: isFhir ? f.type : null,
        time: isFhir ? f.time : null,
        fhirDisplayName: summary.displayName,
        fhirRecordType: summary.recordType,
        fhirSource: summary.source,
      };
    }),
    permission: relation.healthRecordsPermission,
    canUpload: relation.healthRecordsPermission === 'editor',
  });
}
