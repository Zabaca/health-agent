import { NextRequest, NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (session.user.type !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { patientId } = await req.json();

  if (!patientId) return NextResponse.json({ error: "patientId required" }, { status: 400 });

  await db.update(incomingFiles).set({ patientId }).where(eq(incomingFiles.id, id));

  return NextResponse.json({ ok: true });
}
