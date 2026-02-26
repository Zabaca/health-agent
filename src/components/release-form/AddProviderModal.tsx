"use client";

import { Button, Divider, Group, Modal, Stack, Text } from "@mantine/core";
import type { ProviderFormData } from "@/lib/schemas/release";
import type { UserProviderRow } from "@/lib/db/types";
import Link from "next/link";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSelect: (p: ProviderFormData, savedId: string) => void;
  onAddNew: () => void;
  providers: UserProviderRow[];
  usedProviderIds: string[];
}

export function rowToFormData(row: UserProviderRow): ProviderFormData {
  return {
    providerName: row.providerName,
    providerType: row.providerType as ProviderFormData["providerType"],
    physicianName: row.physicianName ?? undefined,
    patientId: row.patientId ?? undefined,
    insurance: row.insurance ?? undefined,
    patientMemberId: row.patientMemberId ?? undefined,
    groupId: row.groupId ?? undefined,
    planName: row.planName ?? undefined,
    phone: row.phone ?? undefined,
    fax: row.fax ?? undefined,
    providerEmail: row.providerEmail ?? undefined,
    address: row.address ?? undefined,
    membershipIdFront: row.membershipIdFront ?? undefined,
    membershipIdBack: row.membershipIdBack ?? undefined,
    historyPhysical: false,
    diagnosticResults: false,
    treatmentProcedure: false,
    prescriptionMedication: false,
    imagingRadiology: false,
    dischargeSummaries: false,
    specificRecords: false,
    specificRecordsDesc: undefined,
    dateRangeFrom: undefined,
    dateRangeTo: undefined,
    allAvailableDates: false,
    purpose: undefined,
    purposeOther: undefined,
  };
}

export default function AddProviderModal({ opened, onClose, onSelect, onAddNew, providers, usedProviderIds }: Props) {
  const availableProviders = providers.filter((p) => !usedProviderIds.includes(p.id));

  const handleSelect = (row: UserProviderRow) => {
    onSelect(rowToFormData(row), row.id);
    onClose();
  };

  const handleAddNew = () => {
    onAddNew();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add Provider" size="md">
      <Stack gap="md">
        <Button variant="light" onClick={handleAddNew}>
          + Add New Provider
        </Button>

        {providers.length === 0 && (
          <Text c="dimmed" size="sm" ta="center">
            No saved providers. Visit{" "}
            <Text component={Link} href="/my-providers" c="blue" td="underline">
              My Providers
            </Text>{" "}
            to save providers for quick re-use.
          </Text>
        )}

        {providers.length > 0 && availableProviders.length === 0 && (
          <Text c="dimmed" size="sm" ta="center">
            All saved providers are already in this release.
          </Text>
        )}

        {availableProviders.length > 0 && (
          <>
            <Divider label="Or select a saved provider" labelPosition="center" />
            <Stack gap="xs">
              {availableProviders.map((p) => (
                <Group key={p.id} justify="space-between" p="xs" style={{ border: "1px solid var(--mantine-color-gray-3)", borderRadius: 8 }}>
                  <Stack gap={0}>
                    <Text fw={500} size="sm">{p.providerName}</Text>
                    <Text c="dimmed" size="xs">{p.providerType}</Text>
                  </Stack>
                  <Button size="xs" variant="light" onClick={() => handleSelect(p)}>
                    Use This Provider
                  </Button>
                </Group>
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Modal>
  );
}
