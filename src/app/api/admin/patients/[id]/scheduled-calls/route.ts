import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledCalls, patientAssignments, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { sendScheduledCallEmail } from "@/lib/email";
import { decryptPii } from "@/lib/crypto";

export const POST = contractRoute(contract.admin.patientScheduledCalls.create, async ({ params, body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate scheduledAt is in the future
  const scheduledDate = new Date(body.scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return NextResponse.json({ error: "scheduledAt must be a valid future date" }, { status: 400 });
  }

  const patient = await db.query.users.findFirst({
    where: eq(users.id, params.id),
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

  // Find the patient's assigned agent
  const assignment = await db.query.patientAssignments.findFirst({
    where: eq(patientAssignments.patientId, params.id),
    with: {
      assignedTo: {
        columns: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "No agent assigned to this patient" }, { status: 404 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(scheduledCalls).values({
    id,
    patientId: params.id,
    agentId: assignment.assignedToId,
    scheduledAt: body.scheduledAt,
    status: 'scheduled',
    createdAt: now,
    updatedAt: now,
  });

  // Notify both patient and agent of the scheduled call
  const decryptedPatient = decryptPii(patient);
  const patientName = [decryptedPatient.firstName, decryptedPatient.lastName].filter(Boolean).join(' ') || 'Patient';
  const agentName = [assignment.assignedTo.firstName, assignment.assignedTo.lastName].filter(Boolean).join(' ') || 'Your care team';
  const adminName = 'Admin';

  await Promise.all([
    sendScheduledCallEmail({
      to: patient.email,
      recipientName: patientName,
      schedulerName: adminName,
      scheduledAt: body.scheduledAt,
    }),
    sendScheduledCallEmail({
      to: assignment.assignedTo.email,
      recipientName: agentName,
      schedulerName: adminName,
      scheduledAt: body.scheduledAt,
    }),
  ]);

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
