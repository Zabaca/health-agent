import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, releases as releasesTable } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Title, Text, Stack } from "@mantine/core";
import PatientReleasesPanel from "@/components/staff/PatientReleasesPanel";
import PatientInfoCard from "@/components/staff/PatientInfoCard";
import { decryptPii } from "@/lib/crypto";

export default async function AdminPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id: patientId } = await params;

  const patient = await db.query.users.findFirst({ where: eq(users.id, patientId) });
  if (!patient) notFound();

  const decryptedPatient = decryptPii(patient);

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
    .where(eq(releasesTable.userId, patientId))
    .orderBy(desc(releasesTable.updatedAt));

  const activeReleases = releases.filter((r) => !r.voided).map((r) => ({ ...r, providerNames: [] as string[] }));
  const voidedReleases = releases.filter((r) => r.voided).map((r) => ({ ...r, providerNames: [] as string[] }));

  const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(' ') || patient.email;

  async function voidRelease(releaseId: string) {
    "use server";
    await db
      .update(releasesTable)
      .set({ voided: true, updatedAt: new Date().toISOString() })
      .where(and(eq(releasesTable.id, releaseId), eq(releasesTable.userId, patientId)));
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{patientName}</Title>
        <Text c="dimmed" size="sm">{patient.email}</Text>
      </div>
      <PatientInfoCard patient={decryptedPatient} />
      <PatientReleasesPanel
        patientId={patientId}
        activeReleases={activeReleases}
        voidedReleases={voidedReleases}
        newReleaseHref={`/admin/patients/${patientId}/releases/new`}
        releaseHrefBase={`/admin/patients/${patientId}/releases`}
        onVoid={voidRelease}
      />
    </Stack>
  );
}
