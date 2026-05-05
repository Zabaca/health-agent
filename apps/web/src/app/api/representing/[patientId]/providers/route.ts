import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { patientDesignatedAgents, userProviders } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

// GET /api/representing/[patientId]/providers
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
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
  });
  if (!relation) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!relation.manageProvidersPermission) return NextResponse.json({ error: "No provider access" }, { status: 403 });

  const providers = await db
    .select()
    .from(userProviders)
    .where(eq(userProviders.userId, patientId))
    .orderBy(asc(userProviders.order));

  return NextResponse.json(providers);
}

// PATCH /api/representing/[patientId]/providers — replace all providers
export async function PUT(
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
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
  });
  if (!relation) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (relation.manageProvidersPermission !== 'editor') return NextResponse.json({ error: "No write access to providers" }, { status: 403 });

  const { providers } = await req.json() as { providers: Array<Record<string, unknown>> };

  await db.transaction(async (tx) => {
    await tx.delete(userProviders).where(eq(userProviders.userId, patientId));
    if (providers.length > 0) {
      await tx.insert(userProviders).values(
        providers.map((p, i) => ({
          id: crypto.randomUUID(),
          userId: patientId,
          order: i,
          providerName: (p.providerName as string) ?? "",
          providerType: (p.providerType as string) ?? null,
          physicianName: (p.physicianName as string) ?? null,
          patientId: (p.patientId as string) ?? null,
          insurance: (p.insurance as string) ?? null,
          patientMemberId: (p.patientMemberId as string) ?? null,
          groupId: (p.groupId as string) ?? null,
          planName: (p.planName as string) ?? null,
          phone: (p.phone as string) ?? null,
          fax: (p.fax as string) ?? null,
          providerEmail: (p.providerEmail as string) ?? null,
          address: (p.address as string) ?? null,
          membershipIdFront: (p.membershipIdFront as string) ?? null,
          membershipIdBack: (p.membershipIdBack as string) ?? null,
        }))
      );
    }
  });

  return NextResponse.json({ success: true });
}
