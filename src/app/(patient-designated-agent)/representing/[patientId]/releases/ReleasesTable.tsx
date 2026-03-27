"use client";

import { useState, useMemo } from "react";
import {
  Table, Text, Badge, Anchor, Group, TextInput, MultiSelect,
  Select, Pagination, Stack,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconSearch, IconEye } from "@tabler/icons-react";
import Link from "next/link";

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

const STATUS_OPTIONS = [
  { value: "signed", label: "Signed" },
  { value: "pending", label: "Awaiting Patient Signature" },
  { value: "voided", label: "Voided" },
];

function getStatus(r: Release): "signed" | "pending" | "voided" {
  if (r.voided) return "voided";
  if (!r.authSignatureImage) return "pending";
  return "signed";
}

function fuzzyMatch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

export default function ReleasesTable({ releases, patientId }: Props) {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = useMemo(() => {
    const [from, to] = dateRange;
    return releases.filter((r) => {
      const providerNames = r.providers.map(p =>
        p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName
      ).join(" ");
      if (!fuzzyMatch(search, providerNames, r.releaseCode)) return false;

      const created = new Date(r.createdAt);
      if (from) { const s = new Date(from); s.setHours(0, 0, 0, 0); if (created < s) return false; }
      if (to)   { const e = new Date(to);   e.setHours(23, 59, 59, 999); if (created > e) return false; }

      if (statusFilter.length > 0 && !statusFilter.includes(getStatus(r))) return false;

      return true;
    });
  }, [releases, search, dateRange, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <Stack gap="sm" mb="md">
        <TextInput
          placeholder="Search provider or release code…"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
        />
        <Group gap="sm" grow>
          <DatePickerInput
            type="range"
            placeholder="Filter by date range"
            value={dateRange}
            onChange={(val) => { setDateRange(val); setPage(1); }}
            clearable
            valueFormat="MM/DD/YYYY"
          />
          <MultiSelect
            placeholder="Filter by status"
            data={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setPage(1); }}
            clearable
          />
        </Group>
      </Stack>

      {releases.length === 0 ? (
        <Text c="dimmed">No releases yet.</Text>
      ) : filtered.length === 0 ? (
        <Text c="dimmed">No releases match your filters.</Text>
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Patient</Table.Th>
                <Table.Th>Providers</Table.Th>
                <Table.Th>Release Code</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginated.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.firstName} {r.lastName}</Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {r.providers.length > 0
                        ? r.providers.map(p => p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName).join(", ")
                        : "—"}
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
                      <Badge color="gray" variant="light">Voided</Badge>
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

          <Group justify="space-between" align="center" mt="md">
            <Group gap="xs" align="center">
              <Text size="sm" c="dimmed">Rows per page:</Text>
              <Select
                value={String(pageSize)}
                onChange={(val) => { setPageSize(Number(val)); setPage(1); }}
                data={["5", "20", "50", "100"]}
                w={80}
                size="xs"
              />
              <Text size="sm" c="dimmed">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</Text>
            </Group>
            <Pagination total={totalPages} value={currentPage} onChange={setPage} size="sm" />
          </Group>
        </>
      )}
    </>
  );
}
