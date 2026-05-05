import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable, users, userProviders } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { type ProviderFormData } from "@/lib/schemas/release";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { encrypt, encryptPii, decryptPii, extractLast4Ssn } from "@/lib/crypto";
import { generateReleaseCode } from "@/lib/utils/releaseCode";
import { sendNewReleaseNotificationEmail } from "@/lib/email";

export const GET = contractRoute(contract.releases.list, async ({ req }) => {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const releases = await db
    .select({
      id: releasesTable.id,
      firstName: releasesTable.firstName,
      lastName: releasesTable.lastName,
      createdAt: releasesTable.createdAt,
      updatedAt: releasesTable.updatedAt,
      voided: releasesTable.voided,
      authSignatureImage: releasesTable.authSignatureImage,
      authExpirationDate: releasesTable.authExpirationDate,
      releaseCode: releasesTable.releaseCode,
      releaseAuthAgent: releasesTable.releaseAuthAgent,
      authAgentName: releasesTable.authAgentName,
      providerName: providersTable.providerName,
      providerType: providersTable.providerType,
      insurance: providersTable.insurance,
    })
    .from(releasesTable)
    .leftJoin(providersTable, and(
      eq(providersTable.releaseId, releasesTable.id),
      eq(providersTable.order, 0)
    ))
    .where(eq(releasesTable.userId, result.userId))
    .orderBy(desc(releasesTable.updatedAt));

  return NextResponse.json(releases);
});

export const POST = contractRoute(contract.releases.create, async ({ req, body }) => {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  try {
    const { providers, ...releaseData } = body;
    const normalizedReleaseData = {
      ...releaseData,
      ssn: releaseData.ssn ? extractLast4Ssn(releaseData.ssn) : "",
    };
    const encryptedReleaseData = encryptPii(normalizedReleaseData);

    const created = await db.transaction(async (tx) => {
      const results = [];
      const now = new Date().toISOString();
      for (const provider of providers) {
        const releaseId = crypto.randomUUID();
        const [newRelease] = await tx
          .insert(releasesTable)
          .values({
            id: releaseId,
            userId: result.userId,
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

    // Silently backfill empty profile fields from submitted release data (plaintext)
    try {
      const userId = result.userId;
      const existingUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
      const patch: Partial<typeof users.$inferInsert> = {};
      if (!existingUser?.firstName)   patch.firstName   = releaseData.firstName;
      if (!existingUser?.middleName)  patch.middleName  = releaseData.middleName;
      if (!existingUser?.lastName)    patch.lastName    = releaseData.lastName;
      if (!existingUser?.dateOfBirth) patch.dateOfBirth = encrypt(releaseData.dateOfBirth);
      if (!existingUser?.address)     patch.address     = releaseData.mailingAddress;
      if (!existingUser?.phoneNumber) patch.phoneNumber = releaseData.phoneNumber;
      if (!existingUser?.ssn && normalizedReleaseData.ssn) {
        patch.ssn = encrypt(normalizedReleaseData.ssn);
      }
      if (Object.keys(patch).length > 0) {
        await db.update(users).set(patch).where(eq(users.id, userId));
      }
    } catch {
      // swallow — do not block the release response
    }

    // Silently backfill userProviders — add new providers without removing existing ones
    try {
      const userId = result.userId;
      const existing = await db.query.userProviders.findMany({ where: eq(userProviders.userId, userId) });
      const existingKeys = new Set(existing.map((p) => `${p.providerType}::${p.insurance || p.providerName}`));
      const toInsert = providers
        .map((p: ProviderFormData) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { historyPhysical, diagnosticResults, treatmentProcedure, prescriptionMedication, imagingRadiology, dischargeSummaries, specificRecords, specificRecordsDesc, dateRangeFrom, dateRangeTo, allAvailableDates, purpose, purposeOther, ...providerInfo } = p;
          return { ...providerInfo, providerName: providerInfo.providerName ?? "" };
        })
        .filter((p) => !existingKeys.has(`${p.providerType}::${p.insurance || p.providerName}`));
      if (toInsert.length > 0) {
        const nextOrder = existing.length;
        await db.insert(userProviders).values(
          toInsert.map((p, i) => ({ id: crypto.randomUUID(), userId, ...p, order: nextOrder + i }))
        );
      }
    } catch {
      // swallow — do not block the release response
    }

    // Notify authorized agent if listed on any release
    try {
      const firstRelease = created[0];
      if (firstRelease?.releaseAuthAgent && firstRelease?.authAgentEmail) {
        const patient = await db.query.users.findFirst({
          where: eq(users.id, result.userId),
          columns: { firstName: true, lastName: true },
        });
        const patientName = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') || releaseData.firstName;
        const recipientName = [firstRelease.authAgentFirstName, firstRelease.authAgentLastName].filter(Boolean).join(' ') || 'Representative';
        await sendNewReleaseNotificationEmail({
          to: firstRelease.authAgentEmail,
          recipientName,
          patientName,
          contact: { name: patientName }, // patient-originated → show patient name, no email
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
