import { NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable, patientAssignments, users } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { encryptPii, decryptPii } from "@/lib/crypto";
import { generateReleaseCode } from "@/lib/utils/releaseCode";
import { sendReleaseSignatureRequiredEmail, getSiteBaseUrl } from "@/lib/email";

async function verifyAssignment(agentId: string, patientId: string) {
  return db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, patientId),
      eq(patientAssignments.assignedToId, agentId)
    ),
  });
}

export const GET = contractRoute(contract.agent.patientReleases.list, async ({ params }) => {
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (!session.user.isAgent) {
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
  const { session, error } = await requireActiveSession();
  if (error) return error;
  if (!session.user.isAgent) {
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
          .values({ id: crypto.randomUUID(), releaseId, order: 0, ...provider, providerName: provider.providerName ?? "" })
          .returning();

        results.push({ ...newRelease, providers: [insertedProvider] });
      }
      return results;
    });

    // Notify patient that a release was created and requires their signature
    try {
      const patient = await db.query.users.findFirst({
        where: eq(users.id, params.id),
        columns: { email: true, firstName: true, lastName: true },
      });
      const agent = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { firstName: true, lastName: true, email: true },
      });
      if (patient) {
        const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(' ') || patient.email;
        const agentName = [agent?.firstName, agent?.lastName].filter(Boolean).join(' ') || 'Your agent';
        await sendReleaseSignatureRequiredEmail({
          to: patient.email,
          patientName,
          createdByName: agentName,
          releasesUrl: `${getSiteBaseUrl()}/releases`,
          contact: { name: agentName, email: agent?.email },
        });
      }
    } catch {
      // swallow — do not block the release response
    }

    return NextResponse.json(created.map(decryptPii), { status: 201 });
  } catch (error) {
    console.error("Create release error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
