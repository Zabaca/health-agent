import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.admin.patients.getById, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const patient = await db.query.users.findFirst({ where: eq(users.id, params.id) });
  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assignment = await db.query.patientAssignments.findFirst({
    where: eq(patientAssignments.patientId, params.id),
  });

  let assignedTo = null;
  if (assignment) {
    const assignee = await db.query.users.findFirst({ where: eq(users.id, assignment.assignedToId) });
    if (assignee) {
      assignedTo = { id: assignee.id, firstName: assignee.firstName, lastName: assignee.lastName, type: assignee.type };
    }
  }

  return NextResponse.json({
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    createdAt: patient.createdAt,
    assignedTo,
  });
});

export const PATCH = contractRoute(contract.admin.patients.reassign, async ({ params, body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const patient = await db.query.users.findFirst({
    where: and(eq(users.id, params.id), eq(users.type, 'patient')),
  });
  if (!patient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assignee = await db.query.users.findFirst({ where: eq(users.id, body.assignedToId) });
  if (!assignee || (assignee.type !== 'admin' && assignee.type !== 'agent')) {
    return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
  }

  const existing = await db.query.patientAssignments.findFirst({
    where: eq(patientAssignments.patientId, params.id),
  });

  if (existing) {
    await db
      .update(patientAssignments)
      .set({ assignedToId: body.assignedToId })
      .where(eq(patientAssignments.patientId, params.id));
  } else {
    await db.insert(patientAssignments).values({
      id: crypto.randomUUID(),
      patientId: params.id,
      assignedToId: body.assignedToId,
    });
  }

  return NextResponse.json({ success: true });
});
