import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { eq, isNull, gte, lte, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.type !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const unassignedOnly = searchParams.get("unassignedOnly") === "true";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const conditions = [isNull(incomingFiles.deletedAt)];
  if (unassignedOnly) conditions.push(isNull(incomingFiles.patientId));
  if (dateFrom) conditions.push(gte(incomingFiles.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(incomingFiles.createdAt, dateTo));

  const files = await db.query.incomingFiles.findMany({
    where: and(...conditions),
    with: { faxLog: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });

  // Fetch patient names for assigned files
  const patientIds = Array.from(new Set(files.map(f => f.patientId).filter(Boolean))) as string[];
  const patients = patientIds.length
    ? await db.query.users.findMany({ where: (u, { inArray }) => inArray(u.id, patientIds) })
    : [];
  const patientMap = new Map(patients.map(p => [p.id, p]));

  const result = files.map(f => ({
    ...f,
    patient: f.patientId ? (patientMap.get(f.patientId) ?? null) : null,
  }));

  return NextResponse.json(result);
}
