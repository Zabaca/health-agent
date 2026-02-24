import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledCalls } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { decryptPii } from "@/lib/crypto";

async function getCallWithPatient(id: string, agentId: string) {
  return db.query.scheduledCalls.findFirst({
    where: and(eq(scheduledCalls.id, id), eq(scheduledCalls.agentId, agentId)),
    with: {
      patient: {
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
      },
    },
  });
}

export const GET = contractRoute(contract.staffScheduledCalls.getById, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const call = await getCallWithPatient(params.id, session.user.id);
  if (!call) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: call.id,
    scheduledAt: call.scheduledAt,
    status: call.status,
    createdAt: call.createdAt,
    updatedAt: call.updatedAt,
    patient: decryptPii(call.patient),
  });
});

export const PATCH = contractRoute(contract.staffScheduledCalls.cancel, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const call = await getCallWithPatient(params.id, session.user.id);
  if (!call) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (call.status === 'cancelled') {
    return NextResponse.json({ error: "Call is already cancelled" }, { status: 400 });
  }

  await db
    .update(scheduledCalls)
    .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
    .where(eq(scheduledCalls.id, params.id));

  const updated = await getCallWithPatient(params.id, session.user.id);

  return NextResponse.json({
    id: updated!.id,
    scheduledAt: updated!.scheduledAt,
    status: updated!.status,
    createdAt: updated!.createdAt,
    updatedAt: updated!.updatedAt,
    patient: decryptPii(updated!.patient),
  });
});
