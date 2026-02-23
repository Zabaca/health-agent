import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.agent.patients.list, async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'agent') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignments = await db.query.patientAssignments.findMany({
    where: eq(patientAssignments.assignedToId, session.user.id),
  });

  if (assignments.length === 0) {
    return NextResponse.json([]);
  }

  const patientIds = assignments.map((a) => a.patientId);
  const patients = await db.query.users.findMany({
    where: inArray(users.id, patientIds),
  });

  const agentUser = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  const assignedTo = agentUser
    ? { id: agentUser.id, firstName: agentUser.firstName, lastName: agentUser.lastName, type: agentUser.type }
    : null;

  const result = patients.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    createdAt: p.createdAt,
    assignedTo,
  }));

  return NextResponse.json(result);
});
