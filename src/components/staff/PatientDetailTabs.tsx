"use client";

import { useRouter } from "next/navigation";
import { Tabs, Stack } from "@mantine/core";
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
