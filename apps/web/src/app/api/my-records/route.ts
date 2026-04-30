import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { and, eq, isNull, lt } from "drizzle-orm";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const url = new URL(req.url);
  const rawLimit = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
    : DEFAULT_LIMIT;
  // ISO createdAt of last item from the prior page; ms-precision makes tie
  // collisions vanishingly rare for one user's record set.
  const cursor = url.searchParams.get("cursor");

  const rows = await db.query.incomingFiles.findMany({
    where: and(
      eq(incomingFiles.patientId, result.userId),
      isNull(incomingFiles.deletedAt),
      cursor ? lt(incomingFiles.createdAt, cursor) : undefined,
    ),
    with: { faxLog: true, uploadLog: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
    limit: limit + 1, // +1 to detect hasMore without a separate count query
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].createdAt : null;

  return NextResponse.json({ items, nextCursor });
}
