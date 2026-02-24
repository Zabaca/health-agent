"use client";

import { useState } from "react";
import { Paper, Title, Table, Button, Badge, Group, Text, Stack, ActionIcon } from "@mantine/core";
import { IconTrash, IconEye, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import type { ReleaseSummary } from "@/lib/db/types";

interface Props {
  patientId: string;
  activeReleases: ReleaseSummary[];
  voidedReleases: ReleaseSummary[];
  newReleaseHref: string;
  releaseHrefBase: string;
  onVoid: (releaseId: string) => Promise<void>;
}

export default function PatientReleasesPanel({
  activeReleases,
  voidedReleases,
  newReleaseHref,
  releaseHrefBase,
  onVoid,
}: Props) {
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [localVoided, setLocalVoided] = useState<string[]>([]);

  const handleVoid = async (releaseId: string) => {
    setVoidingId(releaseId);
    try {
      await onVoid(releaseId);
      setLocalVoided((prev) => [...prev, releaseId]);
    } finally {
      setVoidingId(null);
    }
  };

  const visibleActive = activeReleases.filter((r) => !localVoided.includes(r.id));

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={4}>Releases</Title>
        <Button component={Link} href={newReleaseHref} leftSection={<IconPlus size={16} />} size="sm">
          New Release
        </Button>
      </Group>

      <Paper withBorder p="md" radius="md">
        <Title order={5} mb="sm">Active</Title>
        {visibleActive.length === 0 ? (
          <Text size="sm" c="dimmed">No active releases.</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Updated</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visibleActive.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.firstName} {r.lastName}</Table.Td>
                  <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
                  <Table.Td>{new Date(r.updatedAt).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        component={Link}
                        href={`${releaseHrefBase}/${r.id}`}
                        variant="subtle"
                        size="sm"
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        loading={voidingId === r.id}
                        onClick={() => handleVoid(r.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {(voidedReleases.length > 0 || localVoided.length > 0) && (
        <Paper withBorder p="md" radius="md">
          <Title order={5} mb="sm">Voided</Title>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {[
                ...voidedReleases,
                ...activeReleases.filter((r) => localVoided.includes(r.id)),
              ].map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.firstName} {r.lastName}</Table.Td>
                  <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
                  <Table.Td><Badge color="red">Voided</Badge></Table.Td>
                  <Table.Td>
                    <ActionIcon
                      component={Link}
                      href={`${releaseHrefBase}/${r.id}`}
                      variant="subtle"
                      size="sm"
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
