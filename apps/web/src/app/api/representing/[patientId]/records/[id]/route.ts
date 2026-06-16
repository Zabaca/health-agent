import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import {
  patientDesignatedAgents,
  incomingFiles,
  RECORD_VISIBLE_SOURCES,
} from "@/lib/db/schema";
import { and, eq, isNull, inArray } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";

const FHIR_SOURCE = "healthkitFHIR";

type Reference = { display?: string; actor?: { display?: string } };

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

// GET /api/representing/[patientId]/records/[id] — single record (incl. full
// FHIR resource) scoped to a PDA's granted access. Mirrors /api/my-records/[id]
// but gated on an accepted PDA relation + healthRecordsPermission.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string; id: string }> }
) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { patientId, id } = await params;

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, result.userId),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
  });

  if (!relation) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!relation.healthRecordsPermission) return NextResponse.json({ error: "No document access" }, { status: 403 });

  const row = await db.query.incomingFiles.findFirst({
    where: and(
      eq(incomingFiles.id, id),
      eq(incomingFiles.patientId, patientId),
      isNull(incomingFiles.deletedAt),
      inArray(incomingFiles.source, [...RECORD_VISIBLE_SOURCES]),
    ),
    with: { faxLog: true, uploadLog: true },
  });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (row.source !== FHIR_SOURCE) {
    return NextResponse.json({ ...row, dataBlob: undefined });
  }

  let fhir: { displayName?: string | null; recordType?: string | null; sourceName?: string | null; fhirRelease?: string | null; fhirVersion?: string | null; fhirData?: unknown } = {};
  if (row.dataBlob) {
    try {
      fhir = JSON.parse(decrypt(row.dataBlob));
    } catch {
      fhir = {};
    }
  }

  return NextResponse.json({
    ...row,
    dataBlob: undefined,
    fhirDisplayName: fhir.displayName ?? null,
    fhirRecordType: fhir.recordType ?? null,
    fhirSource: fhir.sourceName ?? fhirSourceName(fhir.fhirData),
    fhirRelease: fhir.fhirRelease ?? null,
    fhirVersion: fhir.fhirVersion ?? null,
    fhirData: fhir.fhirData ?? null,
  });
}
