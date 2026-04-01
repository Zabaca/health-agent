import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, patientAssignments, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendInviteEmail, getSiteBaseUrl } from "@/lib/email";

// GET /api/my-designated-agents — list patient's PDAs + assigned agent
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.type === 'admin' || session.user.isAgent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const patientId = session.user.id;

  const [pdas, assignment] = await Promise.all([
    db.query.patientDesignatedAgents.findMany({
      where: eq(patientDesignatedAgents.patientId, patientId),
      with: { agentUser: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    }),
    db.query.patientAssignments.findFirst({
      where: eq(patientAssignments.patientId, patientId),
      with: { assignedTo: true },
    }),
  ]);

  return NextResponse.json({
    assignedAgent: assignment
      ? {
          id: assignment.assignedTo.id,
          email: assignment.assignedTo.email,
          firstName: assignment.assignedTo.firstName,
          lastName: assignment.assignedTo.lastName,
        }
      : null,
    designatedAgents: pdas.map(p => ({
      id: p.id,
      inviteeEmail: p.inviteeEmail,
      relationship: p.relationship,
      status: p.status,
      healthRecordsPermission: p.healthRecordsPermission,
      manageProvidersPermission: p.manageProvidersPermission,
      releasePermission: p.releasePermission,
      createdAt: p.createdAt,
      tokenExpiresAt: p.tokenExpiresAt ?? null,
      agentUser: p.agentUser
        ? {
            id: p.agentUser.id,
            email: p.agentUser.email,
            firstName: p.agentUser.firstName,
            lastName: p.agentUser.lastName,
            avatarUrl: p.agentUser.avatarUrl ?? null,
          }
        : null,
    })),
  });
}

// POST /api/my-designated-agents — send invite
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.type === 'admin' || session.user.isAgent) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const patientId = session.user.id;
  const body = await req.json() as {
    inviteeEmail: string;
    relationship?: string;
    healthRecordsPermission?: 'viewer' | 'editor' | null;
    manageProvidersPermission?: 'viewer' | 'editor' | null;
    releasePermission?: 'viewer' | 'editor' | null;
  };

  if (!body.inviteeEmail) {
    return NextResponse.json({ error: "inviteeEmail is required" }, { status: 400 });
  }

  // Check for existing pending/accepted invite for this email
  const existing = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.inviteeEmail, body.inviteeEmail),
    ),
  });
  if (existing && (existing.status === 'pending' || existing.status === 'accepted')) {
    return NextResponse.json({ error: "An invite already exists for this email" }, { status: 409 });
  }

  const patient = await db.query.users.findFirst({ where: eq(users.id, patientId) });
  const patientName = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') || patient?.email || 'Patient';

  const token = randomUUID();
  const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const id = randomUUID();

  await db.insert(patientDesignatedAgents).values({
    id,
    patientId,
    inviteeEmail: body.inviteeEmail,
    relationship: body.relationship ?? null,
    token,
    tokenExpiresAt,
    status: 'pending',
    healthRecordsPermission: body.healthRecordsPermission ?? null,
    manageProvidersPermission: body.manageProvidersPermission ?? null,
    releasePermission: body.releasePermission ?? null,
  });

  const baseUrl = getSiteBaseUrl();
  const inviteUrl = `${baseUrl}/invite/${token}`;

  try {
    await sendInviteEmail({
      to: body.inviteeEmail,
      inviteUrl,
      patientName,
      relationship: body.relationship,
      contact: { name: patientName }, // patient-originated → show patient name, no email
    });
  } catch (err) {
    console.error('[invite] email failed:', err);
  }

  return NextResponse.json({ id }, { status: 201 });
}
