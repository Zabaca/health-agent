import { NextRequest, NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { patientDesignatedAgents, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendInviteEmail, getSiteBaseUrl } from "@/lib/email";

// POST /api/my-designated-agents/[id]/resend — resend an expired invite
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (session.user.type === 'admin' || session.user.isAgent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const patientId = session.user.id;

  const record = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.id, id),
      eq(patientDesignatedAgents.patientId, patientId)
    ),
  });

  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (record.status !== 'pending') return NextResponse.json({ error: "Invite is not pending" }, { status: 400 });

  const isExpired = record.tokenExpiresAt && new Date(record.tokenExpiresAt) < new Date();
  if (!isExpired) return NextResponse.json({ error: "Invite has not expired yet" }, { status: 400 });

  const token = randomUUID();
  const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await db
    .update(patientDesignatedAgents)
    .set({ token, tokenExpiresAt, updatedAt: new Date().toISOString() })
    .where(eq(patientDesignatedAgents.id, id));

  const patient = await db.query.users.findFirst({ where: eq(users.id, patientId) });
  const patientName = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') || patient?.email || 'Patient';

  const inviteUrl = `${getSiteBaseUrl()}/invite/${token}`;

  try {
    await sendInviteEmail({
      to: record.inviteeEmail,
      inviteUrl,
      patientName,
      relationship: record.relationship,
      contact: { name: patientName },
    });
  } catch (err) {
    console.error('[invite-resend] email failed:', err);
  }

  return NextResponse.json({ ok: true });
}
