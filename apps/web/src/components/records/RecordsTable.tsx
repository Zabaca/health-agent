'use client';

import { Table, Badge, Anchor } from '@mantine/core';
import Link from 'next/link';

export interface RecordRow {
  id: string;
  createdAt: string;
  source: string;
  pagecount: number | null;
  cid: string | null;
  dnis: string | null;
  patientName?: string | null;
}

interface Props {
  rows: RecordRow[];
  basePath: string;
  showAssignedTo?: boolean;
}

export default function RecordsTable({ rows, basePath, showAssignedTo = false }: Props) {
  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date Received</Table.Th>
          <Table.Th>Source</Table.Th>
          <Table.Th>Pages</Table.Th>
          <Table.Th>Caller ID</Table.Th>
          <Table.Th>DNIS</Table.Th>
          {showAssignedTo && <Table.Th>Assigned To</Table.Th>}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={showAssignedTo ? 6 : 5} style={{ textAlign: 'center', color: 'var(--mantine-color-dimmed)' }}>
              No files received yet.
            </Table.Td>
          </Table.Tr>
        ) : rows.map(r => (
          <Table.Tr key={r.id}>
            <Table.Td>
              <Anchor component={Link} href={`${basePath}/${r.id}`} size="sm">
                {new Date(r.createdAt).toLocaleDateString()}
              </Anchor>
            </Table.Td>
            <Table.Td>
              <Badge variant="light" size="sm">{r.source}</Badge>
            </Table.Td>
            <Table.Td>{r.pagecount ?? '—'}</Table.Td>
            <Table.Td>{r.cid ?? '—'}</Table.Td>
            <Table.Td>{r.dnis ?? '—'}</Table.Td>
            {showAssignedTo && (
              <Table.Td>
                {r.patientName
                  ? <Badge color="green" variant="light" size="sm">{r.patientName}</Badge>
                  : <Badge color="gray" variant="light" size="sm">Unassigned</Badge>
                }
              </Table.Td>
            )}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
