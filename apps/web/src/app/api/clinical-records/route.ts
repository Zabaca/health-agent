import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { encrypt } from "@/lib/crypto";

// HealthKit clinical records (FHIR) are stored as IncomingFile rows with
// source='healthkitFHIR' — records-visible (PDA via permission). The full FHIR
// resource + metadata is encrypted into `dataBlob`; type/time/externalId stay
// cleartext for listing, sorting, and idempotent upsert.
const FHIR_SOURCE = "healthkitFHIR";

const recordSchema = z.object({
  /** HealthKit category, e.g. LabResultRecord, MedicationRecord. */
  recordType: z.string().min(1),
  /** FHIR resource id (dedup key within the patient/source). */
  fhirResourceId: z.string().min(1),
  /** fhirData.resourceType, e.g. Observation, Condition. */
  resourceType: z.string().min(1),
  displayName: z.string().optional(),
  /** Clinical effective/recorded date, if present. */
  effectiveDate: z.string().optional(),
  fhirRelease: z.string().optional(),
  fhirVersion: z.string().optional(),
  /** The raw FHIR resource JSON. */
  fhirData: z.unknown(),
});

const postBodySchema = z.object({ records: z.array(recordSchema).min(1).max(500) });

// POST /api/clinical-records — batch upsert FHIR clinical records from HealthKit
export async function POST(req: NextRequest) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const body = postBodySchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const userId = result.userId;
  const now = new Date().toISOString();

  const rows = body.data.records.map((r) => ({
    id: randomUUID(),
    patientId: userId,
    source: FHIR_SOURCE,
    fileURL: "", // no file — FHIR JSON lives in dataBlob
    fileType: "application/fhir+json",
    type: r.resourceType,
    time: r.effectiveDate ?? null,
    externalId: r.fhirResourceId,
    dataBlob: encrypt(
      JSON.stringify({
        recordType: r.recordType,
        displayName: r.displayName ?? null,
        fhirRelease: r.fhirRelease ?? null,
        fhirVersion: r.fhirVersion ?? null,
        fhirData: r.fhirData,
      }),
    ),
    createdAt: now,
    updatedAt: now,
  }));

  // Collapse duplicate fhirResourceIds within the batch — Apple can surface the
  // same FHIR resource under two categories, and SQLite ON CONFLICT DO UPDATE
  // errors if one INSERT touches the same conflict target twice.
  const deduped = Array.from(new Map(rows.map((r) => [r.externalId, r])).values());

  // Re-sync overwrites the same resource via (patientId, source, externalId).
  await db
    .insert(incomingFiles)
    .values(deduped)
    .onConflictDoUpdate({
      target: [incomingFiles.patientId, incomingFiles.source, incomingFiles.externalId],
      set: {
        dataBlob: sql`excluded."dataBlob"`,
        type: sql`excluded."type"`,
        time: sql`excluded."time"`,
        updatedAt: now,
      },
    });

  return NextResponse.json({ success: true });
}
