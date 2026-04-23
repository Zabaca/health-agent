"use client";

import { useRouter } from "next/navigation";
import { Tabs, Stack, Paper, Title, Table, Badge, Text } from "@mantine/core";
import { IconUser, IconBuilding, IconFileText, IconFolder } from "@tabler/icons-react";
import type { ReleaseSummary } from "@/lib/db/types";
import type { MyProviderFormData } from "@/lib/schemas/release";
import type { PatientDocumentRow } from "@/components/records/PatientDocumentsPanel";
import type { Patient } from "@/components/staff/PatientInfoCard";
import PatientInfoCard from "@/components/staff/PatientInfoCard";
import ReassignPatientControl from "@/components/staff/ReassignPatientControl";
import PatientProvidersPanel from "@/components/staff/PatientProvidersPanel";
import PatientReleasesPanel from "@/components/staff/PatientReleasesPanel";
import PatientDocumentsPanel from "@/components/records/PatientDocumentsPanel";

interface StaffMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  type: "admin" | "agent";
}

interface Pda {
  id: string;
  inviteeEmail: string;
  relationship: string | null;
  status: 'pending' | 'accepted' | 'revoked';
  agentUser: { firstName: string | null; lastName: string | null; email: string } | null;
}

interface ReleaseOption {
  id: string;
  releaseCode: string | null;
  providerNames: string[];
}

interface Props {
  role: "admin" | "agent";
  patientId: string;
  activeTab: string;

  // Overview
  patient: Patient;
  staffMembers: StaffMember[];
  currentAssignedToId: string | null;

  // Providers
  defaultProviders: MyProviderFormData[];

  // Releases
  activeReleases: ReleaseSummary[];
  voidedReleases: ReleaseSummary[];
  newReleaseHref: string;
  releaseHrefBase: string;
  onVoid: (releaseId: string) => Promise<void>;

  // Records
  documents: PatientDocumentRow[];
  releases: ReleaseOption[];
  recordsBasePath: string;

  // PDAs
  pdas: Pda[];
}

export default function PatientDetailTabs({
  role,
  patientId,
  activeTab,
  patient,
  staffMembers,
  currentAssignedToId,
  defaultProviders,
  activeReleases,
  voidedReleases,
  newReleaseHref,
  releaseHrefBase,
  onVoid,
  documents,
  releases,
  recordsBasePath,
  pdas,
}: Props) {
  const router = useRouter();

  return (
    <Tabs
      value={activeTab}
      onChange={(value) => router.push(`?tab=${value}`)}
      keepMounted={false}
      variant="outline"
    >
      <Tabs.List mb="md">
        <Tabs.Tab value="overview" leftSection={<IconUser size={14} />}>Overview</Tabs.Tab>
        <Tabs.Tab value="providers" leftSection={<IconBuilding size={14} />}>Providers</Tabs.Tab>
        <Tabs.Tab value="releases" leftSection={<IconFileText size={14} />}>Releases</Tabs.Tab>
        <Tabs.Tab value="records" leftSection={<IconFolder size={14} />}>Records</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="overview">
        <Stack gap="md">
          <PatientInfoCard patient={patient} />
          <ReassignPatientControl
            mode={role}
            patientId={patientId}
            staffMembers={staffMembers}
            currentAssignedToId={currentAssignedToId}
          />
          <Paper withBorder p="md" radius="md">
            <Title order={4} mb="md">Patient Designated Agents</Title>
            {pdas.length === 0 ? (
              <Text size="sm" c="dimmed">No designated agents.</Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Relationship</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pdas.map((pda) => {
                    const name = pda.agentUser
                      ? [pda.agentUser.firstName, pda.agentUser.lastName].filter(Boolean).join(' ') || pda.agentUser.email
                      : null;
                    const statusColor = pda.status === 'accepted' ? 'teal' : pda.status === 'revoked' ? 'red' : 'orange';
                    return (
                      <Table.Tr key={pda.id}>
                        <Table.Td><Text size="sm">{name ?? '—'}</Text></Table.Td>
                        <Table.Td><Text size="sm">{pda.inviteeEmail}</Text></Table.Td>
                        <Table.Td><Text size="sm">{pda.relationship ?? '—'}</Text></Table.Td>
                        <Table.Td>
                          <Badge color={statusColor} variant="light" tt="capitalize">{pda.status}</Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="providers">
        <PatientProvidersPanel
          patientId={patientId}
          role={role}
          defaultProviders={defaultProviders}
        />
      </Tabs.Panel>

      <Tabs.Panel value="releases">
        <PatientReleasesPanel
          patientId={patientId}
          activeReleases={activeReleases}
          voidedReleases={voidedReleases}
          newReleaseHref={newReleaseHref}
          releaseHrefBase={releaseHrefBase}
          onVoid={onVoid}
        />
      </Tabs.Panel>

      <Tabs.Panel value="records">
        <PatientDocumentsPanel
          patientId={patientId}
          role={role}
          documents={documents}
          releases={releases}
          recordsBasePath={recordsBasePath}
        />
      </Tabs.Panel>
    </Tabs>
  );
}
