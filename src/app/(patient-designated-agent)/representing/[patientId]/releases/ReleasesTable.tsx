"use client";

import { Table, Text, Badge, Anchor } from "@mantine/core";
import Link from "next/link";
import { IconEye } from "@tabler/icons-react";

interface Release {
  id: string;
  firstName: string;
  lastName: string;
  providers: { providerName: string; insurance: string | null; providerType: string }[];
  releaseCode: string | null;
  createdAt: string;
  voided: boolean;
  authSignatureImage: string | null;
}

interface Props {
  releases: Release[];
  patientId: string;
}

export default function ReleasesTable({ releases, patientId }: Props) {
  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Patient</Table.Th>
          <Table.Th>Providers</Table.Th>
          <Table.Th>Release Code</Table.Th>
          <Table.Th>Created</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {releases.map(r => (
          <Table.Tr key={r.id}>
            <Table.Td>{r.firstName} {r.lastName}</Table.Td>
            <Table.Td>
              <Text size="sm">
                {r.providers.length > 0 ? r.providers.map(p => p.providerType === 'Insurance' ? (p.insurance || p.providerName) : p.providerName).join(', ') : '—'}
              </Text>
            </Table.Td>
            <Table.Td>
              {r.releaseCode
                ? <Text size="sm" ff="monospace">{r.releaseCode}</Text>
                : <Text size="sm" c="dimmed">—</Text>}
            </Table.Td>
            <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
            <Table.Td>
              {r.voided ? (
                <Badge color="red" variant="light">Voided</Badge>
              ) : !r.authSignatureImage ? (
                <Badge color="yellow" variant="light">Awaiting Patient Signature</Badge>
              ) : (
                <Badge color="green" variant="light">Signed</Badge>
              )}
            </Table.Td>
            <Table.Td>
              <Anchor component={Link} href={`/representing/${patientId}/releases/${r.id}`} size="sm">
                <IconEye size={16} />
              </Anchor>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
