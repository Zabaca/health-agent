import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { patientDesignatedAgents, users } from "@/lib/db/schema";
import { resolveUserSession } from "@/lib/session-resolver";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/representing/pending/[id] — accept or decline a pending invite
export async function PATCH(req: NextRequest, { params }: Params) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { id } = await params;
  const { action } = await req.json() as { action: "accept" | "decline" };

  const me = await db.query.users.findFirst({
    where: eq(users.id, result.userId),
    columns: { email: true },
  });
  // No invite can match a user without an email address.
  if (!me?.email) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invite = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.id, id),
      eq(patientDesignatedAgents.inviteeEmail, me.email),
      eq(patientDesignatedAgents.status, "pending"),
    ),
  });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "accept") {
    await db
      .update(patientDesignatedAgents)
      .set({ agentUserId: result.userId, status: "accepted", updatedAt: new Date().toISOString() })
      .where(and(eq(patientDesignatedAgents.id, id), eq(patientDesignatedAgents.status, "pending")));
  } else if (action === "decline") {
    await db
      .update(patientDesignatedAgents)
      .set({ status: "revoked", updatedAt: new Date().toISOString() })
      .where(and(eq(patientDesignatedAgents.id, id), eq(patientDesignatedAgents.status, "pending")));
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
