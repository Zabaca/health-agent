import { NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET() {
  const { session, error } = await requireActiveSession();
  if (error) return error;

  const files = await db.query.incomingFiles.findMany({
    where: and(eq(incomingFiles.patientId, session.user.id), isNull(incomingFiles.deletedAt)),
    with: { faxLog: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });

  return NextResponse.json(files);
}
