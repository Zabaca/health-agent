import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledCalls, patientAssignments, users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { isZabacaAgent } from "@/lib/db/agent-role";
import { sendScheduledCallEmail } from "@/lib/email";
import { decryptPii } from "@/lib/crypto";

export const POST = contractRoute(contract.staffScheduledCalls.create, async ({ body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isZabacaAgent(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate scheduledAt is in the future
  const scheduledDate = new Date(body.scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return NextResponse.json({ error: "scheduledAt must be a valid future date" }, { status: 400 });
  }

  // Verify this patient is assigned to the current agent
  const assignment = await db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, body.patientId),
      eq(patientAssignments.assignedToId, session.user.id),
    ),
  });

  if (!assignment) {
    return NextResponse.json({ error: "Patient not found or not assigned to you" }, { status: 404 });
  }

  const patient = await db.query.users.findFirst({
    where: eq(users.id, body.patientId),
    columns: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      dateOfBirth: true,
      address: true,
      phoneNumber: true,
      ssn: true,
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(scheduledCalls).values({
    id,
    patientId: body.patientId,
    agentId: session.user.id,
    scheduledAt: body.scheduledAt,
    status: 'scheduled',
    createdAt: now,
    updatedAt: now,
  });

  // Notify patient of the scheduled call
  const agent = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { firstName: true, lastName: true },
  });
  const decryptedPatient = decryptPii(patient);
  const patientName = [decryptedPatient.firstName, decryptedPatient.lastName].filter(Boolean).join(' ') || 'Patient';
  const agentName = [agent?.firstName, agent?.lastName].filter(Boolean).join(' ') || 'Your care team';
  await sendScheduledCallEmail({
    to: patient.email,
    recipientName: patientName,
    schedulerName: agentName,
    scheduledAt: body.scheduledAt,
  });

  return NextResponse.json(
    {
      id,
      scheduledAt: body.scheduledAt,
      status: 'scheduled' as const,
      createdAt: now,
      updatedAt: now,
      patient: decryptedPatient,
    },
    { status: 201 },
  );
});
