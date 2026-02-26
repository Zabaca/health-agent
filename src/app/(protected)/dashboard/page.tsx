import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, users, patientAssignments, userProviders } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Button, Group, Title } from "@mantine/core";
import Link from "next/link";
import ReleaseList from "@/components/dashboard/ReleaseList";
import VoidedReleaseList from "@/components/dashboard/VoidedReleaseList";
import type { ReleaseSummary } from "@/types/release";
import { decrypt, decryptPii } from "@/lib/crypto";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import type { ProfileFormData } from "@/lib/schemas/profile";
import type { MyProviderFormData, ProviderFormData, ReleaseFormData } from "@/lib/schemas/release";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Dashboard — Medical Record Release" };

export default async function DashboardPage() {
  const session = await auth();

  const userId = session?.user?.id;
  if (!userId) return null;

  const [activeReleases, voidedReleases, user] = await Promise.all([
    db.query.releases.findMany({
      where: and(eq(releasesTable.userId, userId), eq(releasesTable.voided, false)),
      columns: { id: true, firstName: true, lastName: true, createdAt: true, updatedAt: true, voided: true, authSignatureImage: true },
      with: { providers: { columns: { providerName: true }, orderBy: (p, { asc }) => [asc(p.order)] } },
      orderBy: [desc(releasesTable.updatedAt)],
    }),
    db.query.releases.findMany({
      where: and(eq(releasesTable.userId, userId), eq(releasesTable.voided, true)),
      columns: { id: true, firstName: true, lastName: true, createdAt: true, updatedAt: true, voided: true, authSignatureImage: true },
      with: { providers: { columns: { providerName: true }, orderBy: (p, { asc }) => [asc(p.order)] } },
      orderBy: [desc(releasesTable.updatedAt)],
    }),
    db.query.users.findFirst({ where: eq(users.id, userId) }),
  ]);

  const active: ReleaseSummary[] = activeReleases.map((r) => ({ ...r, providerNames: r.providers.map((p) => p.providerName) }));
  const voided: ReleaseSummary[] = voidedReleases.map((r) => ({ ...r, providerNames: r.providers.map((p) => p.providerName) }));

  // Onboarding: only for unboarded patients
  const isUnboardedPatient = user?.type === 'patient' && !user.onboarded;

  let assignedAgent: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    address: string | null;
    avatarUrl: string | null;
  } | null = null;
  let initialProviderValues: MyProviderFormData[] = [];
  let userProviderRows: Awaited<ReturnType<typeof db.query.userProviders.findMany>> = [];
  let initialReleaseId: string | undefined;
  let releaseDefaultValues: Partial<ReleaseFormData>;

  if (isUnboardedPatient) {
    const [assignment, fetchedProviderRows, existingRelease] = await Promise.all([
      db.query.patientAssignments.findFirst({
        where: eq(patientAssignments.patientId, userId),
        with: {
          assignedTo: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              address: true,
              avatarUrl: true,
            },
          },
        },
      }),
      db.query.userProviders.findMany({
        where: eq(userProviders.userId, userId),
        orderBy: (up, { asc }) => [asc(up.order)],
      }),
      db.query.releases.findFirst({
        where: and(eq(releasesTable.userId, userId), eq(releasesTable.voided, false)),
        with: { providers: { orderBy: (p, { asc }) => [asc(p.order)] } },
        orderBy: [desc(releasesTable.updatedAt)],
      }),
    ]);

    assignedAgent = assignment?.assignedTo ?? null;
    userProviderRows = fetchedProviderRows;

    initialProviderValues = userProviderRows.map((p) => ({
      providerName: p.providerName,
      providerType: p.providerType as MyProviderFormData["providerType"],
      physicianName: p.physicianName ?? undefined,
      patientId: p.patientId ?? undefined,
      insurance: p.insurance ?? undefined,
      patientMemberId: p.patientMemberId ?? undefined,
      groupId: p.groupId ?? undefined,
      planName: p.planName ?? undefined,
      phone: p.phone ?? undefined,
      fax: p.fax ?? undefined,
      providerEmail: p.providerEmail ?? undefined,
      address: p.address ?? undefined,
      membershipIdFront: p.membershipIdFront ?? undefined,
      membershipIdBack: p.membershipIdBack ?? undefined,
    }));

    if (existingRelease) {
      // Pre-populate the release form with all existing data, decrypting PII fields
      initialReleaseId = existingRelease.id;
      const dec = decryptPii(existingRelease);
      releaseDefaultValues = {
        firstName:            dec.firstName,
        middleName:           dec.middleName    ?? undefined,
        lastName:             dec.lastName,
        dateOfBirth:          dec.dateOfBirth,
        mailingAddress:       dec.mailingAddress,
        phoneNumber:          dec.phoneNumber,
        email:                dec.email,
        ssn:                  dec.ssn,
        releaseAuthAgent:     dec.releaseAuthAgent,
        releaseAuthZabaca:    dec.releaseAuthZabaca,
        authAgentFirstName:   dec.authAgentFirstName   ?? undefined,
        authAgentLastName:    dec.authAgentLastName    ?? undefined,
        authAgentOrganization:dec.authAgentOrganization?? undefined,
        authAgentAddress:     dec.authAgentAddress     ?? undefined,
        authAgentPhone:       dec.authAgentPhone       ?? undefined,
        authAgentEmail:       dec.authAgentEmail       ?? undefined,
        authExpirationDate:   dec.authExpirationDate   ?? undefined,
        authExpirationEvent:  dec.authExpirationEvent  ?? undefined,
        authPrintedName:      dec.authPrintedName,
        authSignatureImage:   dec.authSignatureImage   ?? undefined,
        authDate:             dec.authDate,
        authAgentName:        dec.authAgentName        ?? undefined,
        providers: existingRelease.providers.map((p) => ({
          providerName:        p.providerName,
          providerType:        p.providerType as ProviderFormData["providerType"],
          physicianName:       p.physicianName       ?? undefined,
          patientId:           p.patientId           ?? undefined,
          insurance:           p.insurance           ?? undefined,
          patientMemberId:     p.patientMemberId     ?? undefined,
          groupId:             p.groupId             ?? undefined,
          planName:            p.planName            ?? undefined,
          phone:               p.phone               ?? undefined,
          fax:                 p.fax                 ?? undefined,
          providerEmail:       p.providerEmail       ?? undefined,
          address:             p.address             ?? undefined,
          membershipIdFront:   p.membershipIdFront   ?? undefined,
          membershipIdBack:    p.membershipIdBack    ?? undefined,
          historyPhysical:     p.historyPhysical,
          diagnosticResults:   p.diagnosticResults,
          treatmentProcedure:  p.treatmentProcedure,
          prescriptionMedication: p.prescriptionMedication,
          imagingRadiology:    p.imagingRadiology,
          dischargeSummaries:  p.dischargeSummaries,
          specificRecords:     p.specificRecords,
          specificRecordsDesc: p.specificRecordsDesc ?? undefined,
          dateRangeFrom:       p.dateRangeFrom       ?? undefined,
          dateRangeTo:         p.dateRangeTo         ?? undefined,
          allAvailableDates:   p.allAvailableDates,
          purpose:             p.purpose             ?? undefined,
          purposeOther:        p.purposeOther        ?? undefined,
        })),
      };
    } else {
      // Fall back to pre-populating from profile data
      releaseDefaultValues = {
        firstName:      user?.firstName   ?? "",
        middleName:     user?.middleName  ?? undefined,
        lastName:       user?.lastName    ?? "",
        dateOfBirth:    user?.dateOfBirth ? decrypt(user.dateOfBirth) : "",
        mailingAddress: user?.address     ?? "",
        phoneNumber:    user?.phoneNumber ?? "",
        email:          session.user.email ?? "",
        ssn:            user?.ssn         ? decrypt(user.ssn) : "",
      };
    }
  } else {
    releaseDefaultValues = {};
  }

  const initialProfileValues: ProfileFormData = {
    firstName:   user?.firstName   ?? "",
    middleName:  user?.middleName  ?? "",
    lastName:    user?.lastName    ?? "",
    dateOfBirth: user?.dateOfBirth ? decrypt(user.dateOfBirth) : "",
    address:     user?.address     ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    ssn:         user?.ssn         ? decrypt(user.ssn) : "",
    avatarUrl:   user?.avatarUrl   ?? "",
  };

  return (
    <>
      {isUnboardedPatient && (
        <OnboardingModal
          assignedAgent={assignedAgent}
          initialProfileValues={initialProfileValues}
          initialProviderValues={initialProviderValues}
          initialProviderRows={userProviderRows}
          releaseDefaultValues={releaseDefaultValues}
          initialReleaseId={initialReleaseId}
        />
      )}
      <Group justify="space-between" mb="lg">
        <Title order={2}>My Releases</Title>
        <Button component={Link} href="/releases/new">
          + New Release
        </Button>
      </Group>
      <ReleaseList releases={active} />
      {voided.length > 0 && (
        <>
          <Title order={3} mt="xl" mb="lg">Voided Releases</Title>
          <VoidedReleaseList releases={voided} />
        </>
      )}
    </>
  );
}
