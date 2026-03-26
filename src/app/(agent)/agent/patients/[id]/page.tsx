import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, releases as releasesTable, patientAssignments, userProviders, zabacaAgentRoles } from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { Title, Text, Stack, Group } from "@mantine/core";
import PatientReleasesPanel from "@/components/staff/PatientReleasesPanel";
import PatientInfoCard from "@/components/staff/PatientInfoCard";
import ReassignPatientControl from "@/components/staff/ReassignPatientControl";
import PatientProvidersPanel from "@/components/staff/PatientProvidersPanel";
import { decryptPii } from "@/lib/crypto";

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

  const decryptedPatient = decryptPii(patient);

  const agentRoles = await db.query.zabacaAgentRoles.findMany({ with: { user: true } });
  const agentUsers = agentRoles.map(r => r.user);
  const adminUsers = await db.query.users.findMany({ where: eq(users.type, 'admin') });
  const staffMembers = [...adminUsers, ...agentUsers];

  const providers = await db.select().from(userProviders).where(eq(userProviders.userId, patientId)).orderBy(asc(userProviders.order));

  const releases = await db
    .select({
      id: releasesTable.id,
      firstName: releasesTable.firstName,
      lastName: releasesTable.lastName,
      createdAt: releasesTable.createdAt,
      updatedAt: releasesTable.updatedAt,
      voided: releasesTable.voided,
      authSignatureImage: releasesTable.authSignatureImage,
      releaseCode: releasesTable.releaseCode,
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
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{patientName}</Title>
          <Text c="dimmed" size="sm">{patient.email}</Text>
        </div>
        <ReassignPatientControl
          inline
          mode="agent"
          patientId={patientId}
          staffMembers={staffMembers.map((s) => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email, type: s.type as 'admin' | 'agent' }))}
          currentAssignedToId={assignment.assignedToId}
        />
      </Group>
      <PatientInfoCard patient={decryptedPatient} />
      <PatientProvidersPanel
        patientId={patientId}
        role="agent"
        defaultProviders={providers.map(({ id: _id, userId: _userId, order: _order, providerType, ...rest }) => ({
          ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? undefined])),
          providerType: providerType as "Insurance" | "Hospital" | "Facility",
        }))}
      />
      <PatientReleasesPanel
        patientId={patientId}
        activeReleases={activeReleases}
        voidedReleases={voidedReleases}
        newReleaseHref={`/agent/patients/${patientId}/releases/new`}
        releaseHrefBase={`/agent/patients/${patientId}/releases`}
        onVoid={voidRelease}
      />
    </Stack>
  );
}
