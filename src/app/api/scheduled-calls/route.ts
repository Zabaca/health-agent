import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledCalls, patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.scheduledCalls.list, async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
