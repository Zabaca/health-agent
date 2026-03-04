import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { isNull, gte, lte, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.type !== 'agent') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // Agents always see unassigned only
  const conditions = [isNull(incomingFiles.patientId)];
  if (dateFrom) conditions.push(gte(incomingFiles.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(incomingFiles.createdAt, dateTo));

  const files = await db.query.incomingFiles.findMany({
    where: and(...conditions),
    with: { faxLog: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });

  return NextResponse.json(files);
}
