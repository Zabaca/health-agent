import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { encrypt, decrypt } from "@/lib/crypto";

// HealthKit telemetry (vitals) is stored as IncomingFile rows with
// source='healthkitTelemetry': patient-only, never shown in records lists.
// The numeric value is encrypted into `dataBlob`; `type`/`time`/`externalId`
// stay cleartext for charting + idempotent upsert.
const TELEMETRY_SOURCE = "healthkitTelemetry";

const healthRecordSchema = z.object({
  type: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  value: z.number().finite(),
  unit: z.string().min(1),
  source: z.string().optional(),
});

const postBodySchema = z.object({
  records: z.array(healthRecordSchema).min(1).max(500),
});

// POST /api/health-data — batch upsert daily aggregates from HealthKit
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
    source: TELEMETRY_SOURCE,
    // No underlying file — '' sentinel keeps the NOT NULL columns satisfied.
    fileURL: "",
    fileType: "healthkit/telemetry",
    type: r.type,
    time: r.date,
    dataBlob: encrypt(JSON.stringify({ value: r.value, unit: r.unit, source: r.source ?? null })),
    externalId: `${r.type}:${r.date}`,
    createdAt: now,
    updatedAt: now,
  }));

  // Re-syncing a day overwrites that day's row via the (patientId, source, externalId) unique index.
  await db
    .insert(incomingFiles)
    .values(rows)
    .onConflictDoUpdate({
      target: [incomingFiles.patientId, incomingFiles.source, incomingFiles.externalId],
      set: {
        dataBlob: sql`excluded."dataBlob"`,
        time: sql`excluded."time"`,
        updatedAt: now,
      },
    });

  return NextResponse.json({ success: true });
}

// GET /api/health-data?from=YYYY-MM-DD&to=YYYY-MM-DD&type=steps,heartRateAvg
export async function GET(req: NextRequest) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const typeParam = searchParams.get("type");

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (from && !dateRegex.test(from)) {
    return NextResponse.json({ error: "invalid from date" }, { status: 400 });
  }
  if (to && !dateRegex.test(to)) {
    return NextResponse.json({ error: "invalid to date" }, { status: 400 });
  }

  const requestedTypes = typeParam ? typeParam.split(",").filter(Boolean) : null;

  const conditions = [
    eq(incomingFiles.patientId, result.userId),
    eq(incomingFiles.source, TELEMETRY_SOURCE),
  ];
  if (from) conditions.push(gte(incomingFiles.time, from));
  if (to) conditions.push(lte(incomingFiles.time, to));

  const rows = await db.query.incomingFiles.findMany({
    where: and(...conditions),
    columns: { id: true, type: true, time: true, dataBlob: true, updatedAt: true },
    orderBy: (t, { asc }) => [asc(t.time), asc(t.type)],
  });

  const filtered = requestedTypes ? rows.filter((r) => r.type && requestedTypes.includes(r.type)) : rows;

  const out = filtered.map((r) => {
    let value = 0;
    let unit = "";
    let source: string | null = null;
    try {
      const parsed = JSON.parse(decrypt(r.dataBlob ?? "")) as { value: number; unit: string; source: string | null };
      value = parsed.value;
      unit = parsed.unit;
      source = parsed.source ?? null;
    } catch {
      // Corrupt/blank blob — skip values, keep the row visible.
    }
    return { id: r.id, type: r.type, date: r.time, value, unit, source, updatedAt: r.updatedAt };
  });

  return NextResponse.json(out);
}
