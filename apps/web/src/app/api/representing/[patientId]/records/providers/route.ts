import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { patientDesignatedAgents, userProviders } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { patientId } = await params;

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, result.userId),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, "accepted"),
    ),
  });

  if (!relation) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!relation.healthRecordsPermission) return NextResponse.json({ error: "No document access" }, { status: 403 });

  const providers = await db
    .select({ id: userProviders.id, providerName: userProviders.providerName, providerType: userProviders.providerType, insurance: userProviders.insurance })
    .from(userProviders)
    .where(eq(userProviders.userId, patientId))
    .orderBy(asc(userProviders.order));

  const out = providers.map((p) => ({
    id: p.id,
    name: p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName,
  }));

  return NextResponse.json({ providers: out });
}
