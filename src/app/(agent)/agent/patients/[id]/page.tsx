import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, releases as releasesTable, patientAssignments } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Title, Text, Stack } from "@mantine/core";
import PatientReleasesPanel from "@/components/staff/PatientReleasesPanel";

export default async function AgentPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id: patientId } = await params;

  if (!session?.user?.id) notFound();

  const assignment = await db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, patientId),
      eq(patientAssignments.assignedToId, session.user.id)
    ),
  });
  if (!assignment) notFound();

  const patient = await db.query.users.findFirst({ where: eq(users.id, patientId) });
  if (!patient) notFound();

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
      <PatientReleasesPanel
        patientId={patientId}
        activeReleases={activeReleases}
        voidedReleases={voidedReleases}
        newReleaseHref={`/agent/patients/${patientId}/releases/new`}
        viewReleaseHref={(releaseId) => `/agent/patients/${patientId}/releases/${releaseId}`}
        onVoid={voidRelease}
      />
    </Stack>
  );
}
