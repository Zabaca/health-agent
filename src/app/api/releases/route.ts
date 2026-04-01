import { NextResponse } from "next/server";
import { requireActiveSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable, users, userProviders } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { type ProviderFormData } from "@/lib/schemas/release";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { encrypt, encryptPii, decryptPii } from "@/lib/crypto";
import { generateReleaseCode } from "@/lib/utils/releaseCode";
import { sendNewReleaseNotificationEmail } from "@/lib/email";

export const GET = contractRoute(contract.releases.list, async () => {
  const { session, error } = await requireActiveSession();
  if (error) return error;

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
    .where(eq(releasesTable.userId, session.user.id))
    .orderBy(desc(releasesTable.updatedAt));

  return NextResponse.json(releases);
});

export const POST = contractRoute(contract.releases.create, async ({ body }) => {
  const { session, error } = await requireActiveSession();
  if (error) return error;

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
            userId: session.user.id,
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
      const userId = session.user.id;
      const existingUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
      const patch: Partial<typeof users.$inferInsert> = {};
      if (!existingUser?.firstName)   patch.firstName   = releaseData.firstName;
      if (!existingUser?.middleName)  patch.middleName  = releaseData.middleName;
      if (!existingUser?.lastName)    patch.lastName    = releaseData.lastName;
      if (!existingUser?.dateOfBirth) patch.dateOfBirth = encrypt(releaseData.dateOfBirth);
      if (!existingUser?.address)     patch.address     = releaseData.mailingAddress;
      if (!existingUser?.phoneNumber) patch.phoneNumber = releaseData.phoneNumber;
      if (!existingUser?.ssn)         patch.ssn         = encrypt(releaseData.ssn);
      if (Object.keys(patch).length > 0) {
        await db.update(users).set(patch).where(eq(users.id, userId));
      }
    } catch {
      // swallow — do not block the release response
    }

    // Silently backfill userProviders from submitted release providers
    try {
      const userId = session.user.id;
      await db.transaction(async (tx) => {
        await tx.delete(userProviders).where(eq(userProviders.userId, userId));
        if (providers.length > 0) {
          await tx.insert(userProviders).values(
            providers.map((p: ProviderFormData, i: number) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { historyPhysical, diagnosticResults, treatmentProcedure, prescriptionMedication, imagingRadiology, dischargeSummaries, specificRecords, specificRecordsDesc, dateRangeFrom, dateRangeTo, allAvailableDates, purpose, purposeOther, ...providerInfo } = p;
              return {
                id: crypto.randomUUID(),
                userId,
                ...providerInfo,
                providerName: providerInfo.providerName ?? "",
                order: i,
              };
            })
          );
        }
      });
    } catch {
      // swallow — do not block the release response
    }

    // Notify authorized agent if listed on any release
    try {
      const firstRelease = created[0];
      if (firstRelease?.releaseAuthAgent && firstRelease?.authAgentEmail) {
        const patient = await db.query.users.findFirst({
          where: eq(users.id, session.user.id),
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
