"use client";

import { useState } from "react";
import { Table, Anchor, Text, Paper, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import Link from "next/link";

interface Patient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  ssnLast4: string | null;
  createdAt: string;
  assignedTo?: { firstName: string | null; lastName: string | null; email: string } | null;
}

interface Props {
  patients: Patient[];
  basePath: string;
  showAssignedTo?: boolean;
}

export default function PatientsTable({ patients, basePath, showAssignedTo }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? patients.filter((p) => {
        const q = query.trim().toLowerCase();
        const fullName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.toLowerCase();
        return (
          (p.firstName ?? "").toLowerCase().includes(q) ||
          (p.lastName ?? "").toLowerCase().includes(q) ||
          fullName.includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.phoneNumber ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          (p.ssnLast4 ?? "").includes(q)
        );
      })
    : patients;

  return (
    <Paper withBorder>
      <TextInput
        placeholder="Search by name, email, or last 4 of SSN…"
        leftSection={<IconSearch size={16} />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        p="sm"
        styles={{ input: { borderRadius: 0, border: "none", borderBottom: "1px solid var(--mantine-color-default-border)" } }}
      />
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Phone</Table.Th>
            <Table.Th>SSN (Last 4)</Table.Th>
            {showAssignedTo && <Table.Th>Assigned To</Table.Th>}
            <Table.Th>Created</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={showAssignedTo ? 6 : 5}>
                <Text size="sm" c="dimmed" ta="center" py="md">No patients match your search.</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            filtered.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>
                  <Anchor component={Link} href={`${basePath}/${p.id}`}>
                    {p.firstName || p.lastName
                      ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()
                      : <Text size="sm" c="dimmed">(no name)</Text>}
                  </Anchor>
                </Table.Td>
                <Table.Td>{p.email}</Table.Td>
                <Table.Td>
                  {p.phoneNumber
                    ? p.phoneNumber
                    : <Text size="sm" c="dimmed">—</Text>}
                </Table.Td>
                <Table.Td>
                  {p.ssnLast4
                    ? <Text size="sm" ff="monospace">••••{p.ssnLast4}</Text>
                    : <Text size="sm" c="dimmed">—</Text>}
                </Table.Td>
                {showAssignedTo && (
                  <Table.Td>
                    {p.assignedTo
                      ? `${p.assignedTo.firstName ?? ""} ${p.assignedTo.lastName ?? ""}`.trim() || p.assignedTo.email
                      : <Text size="sm" c="dimmed">—</Text>}
                  </Table.Td>
                )}
                <Table.Td>{new Date(p.createdAt).toLocaleDateString()}</Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
