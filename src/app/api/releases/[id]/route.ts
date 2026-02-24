import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { encryptPii, decryptPii } from "@/lib/crypto";

async function getRelease(id: string, userId: string) {
  return db.query.releases.findFirst({
    where: and(eq(releasesTable.id, id), eq(releasesTable.userId, userId)),
    with: { providers: { orderBy: [asc(providersTable.order)] } },
  });
}

export const GET = contractRoute(contract.releases.getById, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const release = await getRelease(params.id, session.user.id);
  if (!release) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(decryptPii(release));
});

export const PUT = contractRoute(contract.releases.update, async ({ params, body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getRelease(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { providers, ...updateData } = body;
    const encryptedUpdateData = encryptPii(updateData);

    const release = await db.transaction(async (tx) => {
      await tx.delete(providersTable).where(eq(providersTable.releaseId, params.id));

      const [updated] = await tx
        .update(releasesTable)
        .set({ ...encryptedUpdateData, updatedAt: new Date().toISOString() })
        .where(eq(releasesTable.id, params.id))
        .returning();

      const insertedProviders = providers.length
        ? await tx
            .insert(providersTable)
            .values(
              providers.map((p, i) => ({
                id: crypto.randomUUID(),
                releaseId: params.id,
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

export const PATCH = contractRoute(contract.releases.void, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getRelease(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(releasesTable)
    .set({ voided: true, updatedAt: new Date().toISOString() })
    .where(eq(releasesTable.id, params.id));

  return NextResponse.json({ success: true });
});
