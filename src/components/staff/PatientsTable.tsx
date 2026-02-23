"use client";

import { Table, Anchor, Text, Paper } from "@mantine/core";
import Link from "next/link";

interface Patient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  createdAt: string;
  assignedTo?: { firstName: string | null; lastName: string | null; email: string } | null;
}

interface Props {
  patients: Patient[];
  basePath: string;
  showAssignedTo?: boolean;
}

export default function PatientsTable({ patients, basePath, showAssignedTo }: Props) {
  return (
    <Paper withBorder>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            {showAssignedTo && <Table.Th>Assigned To</Table.Th>}
            <Table.Th>Created</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {patients.map((p) => (
            <Table.Tr key={p.id}>
              <Table.Td>
                <Anchor component={Link} href={`${basePath}/${p.id}`}>
                  {p.firstName || p.lastName
                    ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()
                    : <Text size="sm" c="dimmed">(no name)</Text>}
                </Anchor>
              </Table.Td>
              <Table.Td>{p.email}</Table.Td>
              {showAssignedTo && (
                <Table.Td>
                  {p.assignedTo
                    ? `${p.assignedTo.firstName ?? ""} ${p.assignedTo.lastName ?? ""}`.trim() || p.assignedTo.email
                    : <Text size="sm" c="dimmed">—</Text>}
                </Table.Td>
              )}
              <Table.Td>{new Date(p.createdAt).toLocaleDateString()}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
