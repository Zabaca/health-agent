import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { encryptPii, decryptPii } from "@/lib/crypto";

async function getReleaseForUser(id: string, userId: string) {
  return db.query.releases.findFirst({
    where: and(eq(releasesTable.id, id), eq(releasesTable.userId, userId)),
    with: { providers: { orderBy: [asc(providersTable.order)] } },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { id } = await params;
  const release = await getReleaseForUser(id, result.userId);
  if (!release) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(decryptPii(release));
}

export const PUT = contractRoute(contract.releases.update, async ({ params, body, req }) => {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const existing = await getReleaseForUser(params.id, result.userId);
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
                providerName: p.providerName ?? "",
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { id } = await params;
  const existing = await getReleaseForUser(id, result.userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(releasesTable)
    .set({ voided: true, updatedAt: new Date().toISOString() })
    .where(eq(releasesTable.id, id));

  return NextResponse.json({ success: true });
}
