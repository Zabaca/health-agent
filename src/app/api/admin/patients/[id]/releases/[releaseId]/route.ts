import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { type ProviderFormData } from "@/lib/schemas/release";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { encryptPii, decryptPii } from "@/lib/crypto";

async function getRelease(releaseId: string, patientId: string) {
  return db.query.releases.findFirst({
    where: and(eq(releasesTable.id, releaseId), eq(releasesTable.userId, patientId)),
    with: { providers: { orderBy: [asc(providersTable.order)] } },
  });
}

export const GET = contractRoute(contract.admin.patientReleases.getById, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const release = await getRelease(params.releaseId, params.id);
  if (!release) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(decryptPii(release));
});

export const PUT = contractRoute(contract.admin.patientReleases.update, async ({ params, body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await getRelease(params.releaseId, params.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { providers, ...updateData } = body;
    const encryptedUpdateData = encryptPii(updateData);

    const release = await db.transaction(async (tx) => {
      await tx.delete(providersTable).where(eq(providersTable.releaseId, params.releaseId));
      const [updated] = await tx
        .update(releasesTable)
        .set({ ...encryptedUpdateData, updatedAt: new Date().toISOString() })
        .where(eq(releasesTable.id, params.releaseId))
        .returning();
      const insertedProviders = providers.length
        ? await tx
            .insert(providersTable)
            .values(
              providers.map((p: ProviderFormData, i: number) => ({
                id: crypto.randomUUID(),
                releaseId: params.releaseId,
                ...p,
                order: i,
              }))
            )
            .returning()
        : [];
      return { ...updated, providers: insertedProviders };
    });

    return NextResponse.json(decryptPii(release));
  } catch (error) {
    console.error("Update release error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const PATCH = contractRoute(contract.admin.patientReleases.void, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await getRelease(params.releaseId, params.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(releasesTable)
    .set({ voided: true, updatedAt: new Date().toISOString() })
    .where(eq(releasesTable.id, params.releaseId));

  return NextResponse.json({ success: true });
});
