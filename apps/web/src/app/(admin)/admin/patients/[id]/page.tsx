import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, releases as releasesTable, patientAssignments, userProviders, incomingFiles, zabacaAgentRoles, patientDesignatedAgents } from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { Title, Text, Stack, Group, Badge, Paper, Divider } from "@mantine/core";
import PatientDetailTabs from "@/components/staff/PatientDetailTabs";
import { decryptPii } from "@/lib/crypto";
import DisableUserButton from "@/components/admin/DisableUserButton";

export const dynamic = "force-dynamic";

export default async function AdminPatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  await auth();
  const { id: patientId } = await params;
  const { tab: activeTab = "overview" } = await searchParams;

  const patient = await db.query.users.findFirst({ where: eq(users.id, patientId) });
  if (!patient) notFound();

  const decryptedPatient = decryptPii(patient);

  const [agentRoles, adminUsers, currentAssignment, providers, documents, pdaRows] = await Promise.all([
    db.query.zabacaAgentRoles.findMany({ with: { user: true } }),
    db.query.users.findMany({ where: eq(users.type, 'admin') }),
    db.query.patientAssignments.findFirst({ where: eq(patientAssignments.patientId, patientId) }),
    db.select().from(userProviders).where(eq(userProviders.userId, patientId)).orderBy(asc(userProviders.order)),
    db.query.incomingFiles.findMany({
      where: eq(incomingFiles.patientId, patientId),
      with: { uploadLog: { with: { uploadedBy: true } } },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    }),
    db.query.patientDesignatedAgents.findMany({
      where: eq(patientDesignatedAgents.patientId, patientId),
      with: { agentUser: true },
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    }),
  ]);
  const staffMembers = [
    ...adminUsers.map(u => ({ ...u, _role: 'admin' as const })),
    ...agentRoles.map(r => ({ ...r.user, _role: 'agent' as const })),
  ];

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
      releaseAuthAgent: releasesTable.releaseAuthAgent,
      authAgentFirstName: releasesTable.authAgentFirstName,
      authAgentLastName: releasesTable.authAgentLastName,
    })
    .from(releasesTable)
    .where(eq(releasesTable.userId, patientId))
    .orderBy(desc(releasesTable.updatedAt));

  const activeReleases = releases.filter((r) => !r.voided).map((r) => ({ ...r, providerNames: [] as string[] }));
  const voidedReleases = releases.filter((r) => r.voided).map((r) => ({ ...r, providerNames: [] as string[] }));

  const providerOptions = providers.map((p) => ({
    id: p.id,
    name: (p.providerType === 'Insurance' ? (p.insurance || p.providerName) : p.providerName) ?? '',
  }));
  const providerById = new Map(providerOptions.map(p => [p.id, p.name]));

  const documentRows = documents.map(d => {
    const uploader = d.uploadLog?.uploadedBy;
    return {
      id: d.id,
      createdAt: d.createdAt,
      fileType: d.fileType,
      fileURL: d.fileURL,
      originalName: d.uploadLog?.originalName ?? null,
      userProviderId: d.userProviderId ?? null,
      providerName: d.userProviderId ? (providerById.get(d.userProviderId) ?? null) : null,
      source: d.source,
      uploadedBy: uploader
        ? [uploader.firstName, uploader.lastName].filter(Boolean).join(" ") || uploader.email
        : null,
    };
  });

  const patientName = [patient.firstName, patient.lastName].filter(Boolean).join(" ") || patient.email;

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
          <Group gap="sm" align="center" mb={4}>
            <Title order={2}>{patientName}</Title>
            {!!patient.disabled && (
              <Badge color="red" variant="light">Account Suspended</Badge>
            )}
          </Group>
          <Text c="dimmed" size="sm">{patient.email}</Text>
        </div>
      </Group>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="md">Account Actions</Title>
        <Divider mb="md" />
        <DisableUserButton
          userId={patient.id}
          userName={patientName}
          disabled={!!patient.disabled}
        />
      </Paper>

      <PatientDetailTabs
        role="admin"
        patientId={patientId}
        activeTab={activeTab}
        patient={decryptedPatient}
        staffMembers={staffMembers.map(s => ({ id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email, type: s._role }))}
        currentAssignedToId={currentAssignment?.assignedToId ?? null}
        defaultProviders={providers.map(({ id: _id, userId: _userId, order: _order, providerType, ...rest }) => ({
          ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v ?? undefined])),
          providerType: providerType as "Insurance" | "Hospital" | "Facility",
        }))}
        activeReleases={activeReleases}
        voidedReleases={voidedReleases}
        newReleaseHref={`/admin/patients/${patientId}/releases/new`}
        releaseHrefBase={`/admin/patients/${patientId}/releases`}
        onVoid={voidRelease}
        documents={documentRows}
        userProviders={providerOptions}
        recordsBasePath="/admin/records"
        pdas={pdaRows.map(p => ({ id: p.id, inviteeEmail: p.inviteeEmail, relationship: p.relationship, status: p.status, agentUser: p.agentUser ?? null }))}
      />
    </Stack>
  );
}
