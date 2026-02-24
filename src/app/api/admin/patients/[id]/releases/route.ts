import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { type ProviderFormData } from "@/lib/schemas/release";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { encryptPii, decryptPii } from "@/lib/crypto";

export const GET = contractRoute(contract.admin.patientReleases.list, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const releases = await db
    .select({
      id: releasesTable.id,
      firstName: releasesTable.firstName,
      lastName: releasesTable.lastName,
      createdAt: releasesTable.createdAt,
      updatedAt: releasesTable.updatedAt,
      voided: releasesTable.voided,
    })
    .from(releasesTable)
    .where(eq(releasesTable.userId, params.id))
    .orderBy(desc(releasesTable.updatedAt));

  return NextResponse.json(releases);
});

export const POST = contractRoute(contract.admin.patientReleases.create, async ({ params, body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'admin') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { providers, ...releaseData } = body;
    const encryptedReleaseData = encryptPii(releaseData);

    const release = await db.transaction(async (tx) => {
      const releaseId = crypto.randomUUID();
      const now = new Date().toISOString();
      const [newRelease] = await tx
        .insert(releasesTable)
        .values({
          id: releaseId,
          userId: params.id,
          ...encryptedReleaseData,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const insertedProviders = providers.length
        ? await tx
            .insert(providersTable)
            .values(
              providers.map((p: ProviderFormData, i: number) => ({
                id: crypto.randomUUID(),
                releaseId,
                ...p,
                order: i,
              }))
            )
            .returning()
        : [];

      return { ...newRelease, providers: insertedProviders };
    });

    return NextResponse.json(decryptPii(release), { status: 201 });
  } catch (error) {
    console.error("Create release error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
