import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { and, eq, isNull, lt, or } from "drizzle-orm";

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
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? `${last.createdAt}|${last.id}` : null;

  return NextResponse.json({ items, nextCursor });
}
