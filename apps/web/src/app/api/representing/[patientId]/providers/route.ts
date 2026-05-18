import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { patientDesignatedAgents, userProviders } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { myProviderSchema } from "@/lib/schemas/release";

const replaceProvidersBodySchema = z.object({
  providers: z.array(myProviderSchema),
});

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

  const parsed = replaceProvidersBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { providers } = parsed.data;

  await db.transaction(async (tx) => {
    await tx.delete(userProviders).where(eq(userProviders.userId, patientId));
    if (providers.length > 0) {
      await tx.insert(userProviders).values(
        providers.map((p, i) => ({
          id: nanoid(),
          userId: patientId,
          order: i,
          providerName: p.providerName ?? "",
          providerType: p.providerType ?? null,
          physicianName: p.physicianName ?? null,
          patientId: p.patientId ?? null,
          insurance: p.insurance ?? null,
          patientMemberId: p.patientMemberId ?? null,
          groupId: p.groupId ?? null,
          planName: p.planName ?? null,
          phone: p.phone ?? null,
          fax: p.fax ?? null,
          providerEmail: p.providerEmail ?? null,
          address: p.address ?? null,
          membershipIdFront: p.membershipIdFront ?? null,
          membershipIdBack: p.membershipIdBack ?? null,
        }))
      );
    }
  });

  return NextResponse.json({ success: true });
}
