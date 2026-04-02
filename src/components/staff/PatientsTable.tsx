"use client";

import { useState, useMemo } from "react";
import { Table, Anchor, Text, Paper, TextInput, Group, Select, Pagination, Badge } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import Link from "next/link";

interface Patient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  ssnLast4: string | null;
  disabled: boolean | number;
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    if (!query.trim()) return patients;
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      const fullName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.toLowerCase();
      return (
        (p.firstName ?? "").toLowerCase().includes(q) ||
        (p.lastName ?? "").toLowerCase().includes(q) ||
        fullName.includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phoneNumber ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        (p.ssnLast4 ?? "").includes(q)
      );
    });
  }, [patients, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const colSpan = showAssignedTo ? 6 : 5;

  return (
    <>
      <Paper withBorder>
        <TextInput
          placeholder="Search by name, email, or last 4 of SSN…"
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => { setQuery(e.currentTarget.value); setPage(1); }}
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
                <Table.Td colSpan={colSpan}>
                  <Text size="sm" c="dimmed" ta="center" py="md">No patients match your search.</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              paginated.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Group gap="xs" align="center" wrap="nowrap">
                      <Anchor component={Link} href={`${basePath}/${p.id}`}>
                        {p.firstName || p.lastName
                          ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()
                          : <Text size="sm" c="dimmed">(no name)</Text>}
                      </Anchor>
                      {!!p.disabled && <Badge color="red" variant="light" size="xs">Suspended</Badge>}
                    </Group>
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

      <Group justify="space-between" align="center" mt="md">
        <Group gap="xs" align="center">
          <Text size="sm" c="dimmed">Rows per page:</Text>
          <Select
            value={String(pageSize)}
            onChange={(val) => { setPageSize(Number(val)); setPage(1); }}
            data={["20", "50", "100"]}
            w={80}
            size="xs"
          />
          <Text size="sm" c="dimmed">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</Text>
        </Group>
        <Pagination total={totalPages} value={currentPage} onChange={setPage} size="sm" />
      </Group>
    </>
  );
}
