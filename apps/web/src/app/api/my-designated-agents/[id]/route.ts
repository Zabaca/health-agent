import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { patientDesignatedAgents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/my-designated-agents/[id] — update permissions or relationship
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;
  if (result.type === 'admin' || result.isAgent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const record = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.id, id),
      eq(patientDesignatedAgents.patientId, result.userId)
    ),
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    relationship?: string | null;
    healthRecordsPermission?: 'viewer' | 'editor' | null;
    manageProvidersPermission?: 'viewer' | 'editor' | null;
    releasePermission?: 'viewer' | 'editor' | null;
  };

  await db
    .update(patientDesignatedAgents)
    .set({
      ...(body.relationship !== undefined && { relationship: body.relationship }),
      ...(body.healthRecordsPermission !== undefined && { healthRecordsPermission: body.healthRecordsPermission }),
      ...(body.manageProvidersPermission !== undefined && { manageProvidersPermission: body.manageProvidersPermission }),
      ...(body.releasePermission !== undefined && { releasePermission: body.releasePermission }),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(patientDesignatedAgents.id, id));

  return NextResponse.json({ success: true });
}

// DELETE /api/my-designated-agents/[id] — revoke access
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;
  if (result.type === 'admin' || result.isAgent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const record = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.id, id),
      eq(patientDesignatedAgents.patientId, result.userId)
    ),
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(patientDesignatedAgents)
    .set({ status: 'revoked', updatedAt: new Date().toISOString() })
    .where(eq(patientDesignatedAgents.id, id));

  return NextResponse.json({ success: true });
}
