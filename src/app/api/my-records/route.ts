import { NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { session, error } = await requireActiveSession();
  if (error) return error;

  const files = await db.query.incomingFiles.findMany({
    where: eq(incomingFiles.patientId, session.user.id),
    with: { faxLog: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });

  return NextResponse.json(files);
}
