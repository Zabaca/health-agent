import { NextRequest, NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { incomingFiles, patientAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (!session.user.isAgent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { patientId } = await req.json();

  if (!patientId) return NextResponse.json({ error: "patientId required" }, { status: 400 });

  // Verify this patient is assigned to this agent
  const assignment = await db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, patientId),
      eq(patientAssignments.assignedToId, session.user.id)
    ),
  });

  if (!assignment) {
    return NextResponse.json({ error: "Patient not assigned to you" }, { status: 403 });
  }

  await db.update(incomingFiles).set({ patientId }).where(eq(incomingFiles.id, id));

  return NextResponse.json({ ok: true });
}
