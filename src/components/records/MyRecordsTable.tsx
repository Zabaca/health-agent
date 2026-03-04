'use client';

import { Table, Badge, Anchor } from '@mantine/core';
import Link from 'next/link';

export interface MyRecordRow {
  id: string;
  createdAt: string;
  fileType: string;
  pagecount: number | null;
}

interface Props {
  rows: MyRecordRow[];
}

export default function MyRecordsTable({ rows }: Props) {
  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date Received</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Pages</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={3} style={{ textAlign: 'center', color: 'var(--mantine-color-dimmed)' }}>
              No records yet.
            </Table.Td>
          </Table.Tr>
        ) : rows.map(r => (
          <Table.Tr key={r.id}>
            <Table.Td>
              <Anchor component={Link} href={`/my-records/${r.id}`} size="sm">
                {new Date(r.createdAt).toLocaleDateString()}
              </Anchor>
            </Table.Td>
            <Table.Td>
              <Badge variant="light" size="sm">{r.fileType.toUpperCase()}</Badge>
            </Table.Td>
            <Table.Td>{r.pagecount ?? '—'}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
