import { NextRequest, NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { isNull, gte, lte, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (!session.user.isAgent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // Agents always see unassigned only
  const conditions = [isNull(incomingFiles.patientId), isNull(incomingFiles.deletedAt)];
  if (dateFrom) conditions.push(gte(incomingFiles.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(incomingFiles.createdAt, dateTo));

  const files = await db.query.incomingFiles.findMany({
    where: and(...conditions),
    with: { faxLog: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });

  return NextResponse.json(files);
}
