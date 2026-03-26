import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { patientDesignatedAgents, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { hashPassword } from "@/lib/auth-helpers";
import { randomUUID } from "crypto";

// GET /api/invites/[token] — validate invite token (public, no auth required)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.token, token),
      eq(patientDesignatedAgents.status, 'pending')
    ),
    with: { patient: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  if (invite.tokenExpiresAt && new Date(invite.tokenExpiresAt) < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  const patientName = [invite.patient?.firstName, invite.patient?.lastName].filter(Boolean).join(' ') || invite.patient?.email || 'Patient';

  return NextResponse.json({
    inviteId: invite.id,
    inviteeEmail: invite.inviteeEmail,
    patientName,
    relationship: invite.relationship,
  });
}

// POST /api/invites/[token]/accept — accept invite after login or registration
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json() as { action: 'login' | 'register'; password?: string; firstName?: string; lastName?: string };

  const invite = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.token, token),
      eq(patientDesignatedAgents.status, 'pending')
    ),
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  if (invite.tokenExpiresAt && new Date(invite.tokenExpiresAt) < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  let agentUserId: string;

  if (body.action === 'register') {
    if (!body.password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    // Check if user already exists with this email
    const existing = await db.query.users.findFirst({
      where: eq(users.email, invite.inviteeEmail),
    });

    if (existing) {
      // Link to existing user without changing their type
      agentUserId = existing.id;
    } else {
      // Create new user as patient_designated_agent
      const hashed = await hashPassword(body.password);
      agentUserId = randomUUID();
      await db.insert(users).values({
        id: agentUserId,
        email: invite.inviteeEmail,
        password: hashed,
        type: 'patient_designated_agent',
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        onboarded: true,
      });
    }
  } else {
    // login action — user must already be authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Must be logged in to accept invite" }, { status: 401 });
    }
    agentUserId = session.user.id;
  }

  // Accept the invite
  await db
    .update(patientDesignatedAgents)
    .set({
      agentUserId,
      status: 'accepted',
      token: null,
      tokenExpiresAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(patientDesignatedAgents.id, invite.id));

  return NextResponse.json({ success: true });
}
