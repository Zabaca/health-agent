import { NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { userProviders, patientAssignments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

async function checkAgentAccess(agentId: string, patientId: string) {
  return db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, patientId),
      eq(patientAssignments.assignedToId, agentId)
    ),
  });
}

export const GET = contractRoute(contract.agent.patientProviders.list, async ({ params }) => {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (!session.user.isAgent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignment = await checkAgentAccess(session.user.id, params.id);
  if (!assignment) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const providers = await db.query.userProviders.findMany({
    where: eq(userProviders.userId, params.id),
  });

  return NextResponse.json(providers);
});

export const PUT = contractRoute(contract.agent.patientProviders.replace, async ({ params, body }) => {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (!session.user.isAgent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignment = await checkAgentAccess(session.user.id, params.id);
  if (!assignment) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { providers } = body;
  const userId = params.id;

  await db.transaction(async (tx) => {
    await tx.delete(userProviders).where(eq(userProviders.userId, userId));
    if (providers.length > 0) {
      await tx.insert(userProviders).values(
        providers.map((p, i) => ({
          id: crypto.randomUUID(),
          userId,
          ...p,
          providerName: p.providerName ?? "",
          order: i,
        }))
      );
    }
  });

  return NextResponse.json({ success: true });
});
