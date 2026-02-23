import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
