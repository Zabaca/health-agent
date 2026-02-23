import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.admin.patients.list, async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allPatients = await db.query.users.findMany({
    where: inArray(users.type, ['patient', 'agent']),
  });

  const assignments = await db.query.patientAssignments.findMany();
  const assigneeIds = Array.from(new Set(assignments.map((a) => a.assignedToId)));
  const assignees = assigneeIds.length
    ? await db.query.users.findMany({ where: inArray(users.id, assigneeIds) })
    : [];

  const assigneeMap = new Map(assignees.map((u) => [u.id, u]));
  const assignmentMap = new Map(assignments.map((a) => [a.patientId, a]));

  const result = allPatients.map((p) => {
    const assignment = assignmentMap.get(p.id);
    const assignee = assignment ? assigneeMap.get(assignment.assignedToId) : undefined;
    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      createdAt: p.createdAt,
      assignedTo: assignee
        ? { id: assignee.id, firstName: assignee.firstName, lastName: assignee.lastName, type: assignee.type }
        : null,
    };
  });

  return NextResponse.json(result);
});
