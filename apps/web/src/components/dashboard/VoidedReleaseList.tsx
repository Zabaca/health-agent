"use client";

import { Table, Text, ActionIcon, Group, Tooltip } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import type { ReleaseSummary } from "@/types/release";
import Link from "next/link";

interface Props {
  releases: ReleaseSummary[];
}

export default function VoidedReleaseList({ releases }: Props) {
  const rows = releases.map((r) => (
    <Table.Tr key={r.id}>
      <Table.Td>
        {r.firstName} {r.lastName}
      </Table.Td>
      <Table.Td>
        {r.providerNames.length > 0 ? (
          <Text size="sm">{r.providerNames.join(", ")}</Text>
        ) : (
          <Text size="sm" c="dimmed">—</Text>
        )}
      </Table.Td>
      <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
      <Table.Td>{new Date(r.updatedAt).toLocaleString()}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="View">
            <ActionIcon component={Link} href={`/releases/${r.id}`} variant="light">
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Patient Name</Table.Th>
          <Table.Th>Providers</Table.Th>
          <Table.Th>Created</Table.Th>
          <Table.Th>Last Updated</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
