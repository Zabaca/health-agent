import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable, patientAssignments } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { encryptPii, decryptPii } from "@/lib/crypto";
import { generateReleaseCode } from "@/lib/utils/releaseCode";

async function verifyAssignment(agentId: string, patientId: string) {
  return db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, patientId),
      eq(patientAssignments.assignedToId, agentId)
    ),
  });
}

export const GET = contractRoute(contract.agent.patientReleases.list, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'agent') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignment = await verifyAssignment(session.user.id, params.id);
  if (!assignment) {
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

export const POST = contractRoute(contract.agent.patientReleases.create, async ({ params, body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'agent') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignment = await verifyAssignment(session.user.id, params.id);
  if (!assignment) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { providers, ...releaseData } = body;
    const encryptedReleaseData = encryptPii(releaseData);

    const created = await db.transaction(async (tx) => {
      const results = [];
      const now = new Date().toISOString();
      for (const provider of providers) {
        const releaseId = crypto.randomUUID();
        const [newRelease] = await tx
          .insert(releasesTable)
          .values({
            id: releaseId,
            userId: params.id,
            ...encryptedReleaseData,
            createdAt: now,
            updatedAt: now,
            releaseCode: generateReleaseCode(),
          })
          .returning();

        const [insertedProvider] = await tx
          .insert(providersTable)
          .values({ id: crypto.randomUUID(), releaseId, order: 0, ...provider })
          .returning();

        results.push({ ...newRelease, providers: [insertedProvider] });
      }
      return results;
    });

    return NextResponse.json(created.map(decryptPii), { status: 201 });
  } catch (error) {
    console.error("Create release error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
