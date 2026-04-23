import { NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { scheduledCalls, patientAssignments, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { sendScheduledCallEmail } from "@/lib/email";

export const GET = contractRoute(contract.scheduledCalls.list, async () => {
  const { session, error } = await requireActiveSession();
  if (error) return error;

  const calls = await db.query.scheduledCalls.findMany({
    where: eq(scheduledCalls.patientId, session.user.id),
    with: {
      agent: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          address: true,
        },
      },
    },
    orderBy: (sc, { desc }) => [desc(sc.scheduledAt)],
  });

  const result = calls.map((c) => ({
    id: c.id,
    scheduledAt: c.scheduledAt,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    agent: c.agent,
  }));

  return NextResponse.json(result);
});

export const POST = contractRoute(contract.scheduledCalls.create, async ({ body }) => {
  const { session, error } = await requireActiveSession();
  if (error) return error;

  // Validate scheduledAt is in the future
  const scheduledDate = new Date(body.scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return NextResponse.json({ error: "scheduledAt must be a valid future date" }, { status: 400 });
  }

  // Find patient's assigned agent
  const assignment = await db.query.patientAssignments.findFirst({
    where: eq(patientAssignments.patientId, session.user.id),
    with: {
      assignedTo: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          address: true,
        },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "No agent assigned to you" }, { status: 404 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(scheduledCalls).values({
    id,
    patientId: session.user.id,
    agentId: assignment.assignedToId,
    scheduledAt: body.scheduledAt,
    status: 'scheduled',
    createdAt: now,
    updatedAt: now,
  });

  // Notify agent of the scheduled call
  try {
    const patient = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { firstName: true, lastName: true },
    });
    const patientName = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') || 'Your patient';
    const agentName = [assignment.assignedTo.firstName, assignment.assignedTo.lastName].filter(Boolean).join(' ') || 'Agent';
    await sendScheduledCallEmail({
      to: assignment.assignedTo.email,
      recipientName: agentName,
      schedulerName: patientName,
      scheduledAt: body.scheduledAt,
      callId: id,
      contact: null, // patient-originated → no footer for agent recipient
    });
  } catch {
    // swallow — do not block the response
  }

  return NextResponse.json(
    {
      id,
      scheduledAt: body.scheduledAt,
      status: 'scheduled' as const,
      createdAt: now,
      updatedAt: now,
      agent: assignment.assignedTo,
    },
    { status: 201 }
  );
});
