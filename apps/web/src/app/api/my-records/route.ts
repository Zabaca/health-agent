import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { incomingFiles, RECORD_VISIBLE_SOURCES } from "@/lib/db/schema";
import { and, eq, isNull, lt, or, inArray } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";

const FHIR_SOURCE = "healthkitFHIR";

type Reference = { display?: string; actor?: { display?: string } };

/** Best-effort source name extraction from a FHIR resource. Apple Health's
 *  MyQuest, MyChart, etc. integrations populate one of these depending on the
 *  resource type — performer/recorder/asserter/informationSource are the most
 *  reliable signal of the lab or clinic that produced the record. */
function fhirSourceName(fhirData: unknown): string | null {
  if (!fhirData || typeof fhirData !== "object") return null;
  const d = fhirData as Record<string, unknown>;
  const performers = d.performer as Reference[] | undefined;
  const p0 = performers?.[0];
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

/** Pulls just the display fields out of the encrypted blob — fhirData is
 *  intentionally excluded here to keep list payloads small. The detail
 *  endpoint returns the full resource. */
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
      // Prefer HKSource (Apple's display name for the source app/integration);
      // fall back to FHIR performer/recorder for legacy records ingested before
      // the sourceName field was captured.
      source: parsed.sourceName ?? fhirSourceName(parsed.fhirData),
    };
  } catch {
    return { displayName: null, recordType: null, source: null };
  }
}

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

/**
 * Composite cursor: `<iso createdAt>|<id>`. Two records sharing a millisecond
 * createdAt (rare but real with bulk fax ingest / seeded data) would both
 * fall on a page boundary if the cursor was just createdAt — the row matching
 * the cursor would be excluded by `lt(...)` even though it hasn't been
 * delivered yet. Tie-breaking on `id` makes pagination deterministic.
 */
function parseCursor(raw: string | null): { ts: string; id: string } | null {
  if (!raw) return null;
  const idx = raw.indexOf("|");
  if (idx === -1) return null;
  const ts = raw.slice(0, idx);
  const id = raw.slice(idx + 1);
  if (!ts || !id) return null;
  return { ts, id };
}

export async function GET(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const url = new URL(req.url);
  const rawLimit = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const cursor = parseCursor(url.searchParams.get("cursor"));

  const rows = await db.query.incomingFiles.findMany({
    where: and(
      eq(incomingFiles.patientId, result.userId),
      isNull(incomingFiles.deletedAt),
      inArray(incomingFiles.source, [...RECORD_VISIBLE_SOURCES]),
      cursor
        ? or(
            lt(incomingFiles.createdAt, cursor.ts),
            and(eq(incomingFiles.createdAt, cursor.ts), lt(incomingFiles.id, cursor.id)),
          )
        : undefined,
    ),
    with: { faxLog: true, uploadLog: true },
    orderBy: (f, { desc }) => [desc(f.createdAt), desc(f.id)],
    limit: limit + 1, // +1 to detect hasMore without a separate count query
  });

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;

  // Project to the wire shape. For FHIR rows, surface displayName + recordType
  // by decrypting the small portion of dataBlob the list needs; fhirData stays
  // server-side (fetched on demand via /api/my-records/[id]).
  const items = sliced.map((r) => {
    const isFhir = r.source === FHIR_SOURCE;
    const summary = isFhir
      ? fhirSummary(r.dataBlob)
      : { displayName: null, recordType: null, source: null };
    return {
      ...r,
      dataBlob: undefined,
      fhirDisplayName: summary.displayName,
      fhirRecordType: summary.recordType,
      fhirSource: summary.source,
    };
  });

  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? `${last.createdAt}|${last.id}` : null;

  return NextResponse.json({ items, nextCursor });
}
