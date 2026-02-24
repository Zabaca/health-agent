import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledCalls } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

async function getCallWithAgent(id: string, patientId: string) {
  return db.query.scheduledCalls.findFirst({
    where: and(eq(scheduledCalls.id, id), eq(scheduledCalls.patientId, patientId)),
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
  });
}

export const GET = contractRoute(contract.scheduledCalls.getById, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const call = await getCallWithAgent(params.id, session.user.id);
  if (!call) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: call.id,
    scheduledAt: call.scheduledAt,
    status: call.status,
    createdAt: call.createdAt,
    updatedAt: call.updatedAt,
    agent: call.agent,
  });
});

export const PATCH = contractRoute(contract.scheduledCalls.update, async ({ params, body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const call = await getCallWithAgent(params.id, session.user.id);
  if (!call) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: { scheduledAt?: string; status?: 'scheduled' | 'cancelled'; updatedAt: string } = {
    updatedAt: new Date().toISOString(),
  };

  if (body.scheduledAt !== undefined) {
    const scheduledDate = new Date(body.scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json({ error: "scheduledAt must be a valid future date" }, { status: 400 });
    }
    updates.scheduledAt = body.scheduledAt;
  }

  if (body.status === 'cancelled') {
    updates.status = 'cancelled';
  }

  await db
    .update(scheduledCalls)
    .set(updates)
    .where(eq(scheduledCalls.id, params.id));

  const updated = await getCallWithAgent(params.id, session.user.id);

  return NextResponse.json({
    id: updated!.id,
    scheduledAt: updated!.scheduledAt,
    status: updated!.status,
    createdAt: updated!.createdAt,
    updatedAt: updated!.updatedAt,
    agent: updated!.agent,
  });
});
