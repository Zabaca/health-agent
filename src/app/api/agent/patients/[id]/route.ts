import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.agent.patients.getById, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'agent') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignment = await db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, params.id),
      eq(patientAssignments.assignedToId, session.user.id)
    ),
  });
  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patient = await db.query.users.findFirst({ where: eq(users.id, params.id) });
  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const agentUser = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  const assignedTo = agentUser
    ? { id: agentUser.id, firstName: agentUser.firstName, lastName: agentUser.lastName, type: agentUser.type }
    : null;

  return NextResponse.json({
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    createdAt: patient.createdAt,
    assignedTo,
  });
});

export const PATCH = contractRoute(contract.agent.patients.reassign, async ({ params, body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'agent') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignment = await db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, params.id),
      eq(patientAssignments.assignedToId, session.user.id)
    ),
  });
  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assignee = await db.query.users.findFirst({ where: eq(users.id, body.assignedToId) });
  if (!assignee || (assignee.type !== 'admin' && assignee.type !== 'agent')) {
    return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
  }

  await db
    .update(patientAssignments)
    .set({ assignedToId: body.assignedToId })
    .where(eq(patientAssignments.patientId, params.id));

  return NextResponse.json({ success: true });
});
