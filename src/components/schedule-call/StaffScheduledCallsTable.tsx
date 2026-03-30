"use client";

import { useState, useMemo } from "react";
import { Table, Badge, Text, Paper, Button, Group, Modal, TextInput, MultiSelect, Stack, Select, Pagination } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconSearch } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { errorSchema } from "@/lib/api/response-schemas";

interface Patient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface ScheduledCall {
  id: string;
  scheduledAt: string;
  status: 'scheduled' | 'cancelled';
  patient: Patient;
}

interface Props {
  calls: ScheduledCall[];
  basePath: string;
}

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "cancelled", label: "Cancelled" },
];

function fuzzyMatch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

export default function StaffScheduledCallsTable({ calls, basePath }: Props) {
  const router = useRouter();
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [opened, { open, close }] = useDisclosure(false);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const openCancel = (id: string) => {
    setCancelTargetId(id);
    setError('');
    open();
  };

  const handleCancel = async () => {
    if (!cancelTargetId) return;
    setLoading(true);
    try {
      const result = await apiClient.staffScheduledCalls.cancel({
        params: { id: cancelTargetId },
        body: { status: 'cancelled' },
      });
      if (result.status === 200) {
        close();
        router.refresh();
      } else {
        setError(errorSchema.safeParse(result.body).data?.error ?? 'Failed to cancel. Please try again.');
      }
    } catch {
      setError('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const [from, to] = dateRange;
    return calls.filter((call) => {
      const patientName = [call.patient.firstName, call.patient.lastName].filter(Boolean).join(" ");
      if (!fuzzyMatch(search, patientName, call.patient.email)) return false;

      const scheduled = new Date(call.scheduledAt);
      if (from) { const s = new Date(from); s.setHours(0, 0, 0, 0); if (scheduled < s) return false; }
      if (to)   { const e = new Date(to);   e.setHours(23, 59, 59, 999); if (scheduled > e) return false; }

      if (statusFilter.length > 0 && !statusFilter.includes(call.status)) return false;

      return true;
    });
  }, [calls, search, dateRange, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (calls.length === 0) {
    return <Text c="dimmed">No scheduled calls yet.</Text>;
  }

  return (
    <>
      <Modal opened={opened} onClose={close} title="Cancel Call" centered>
        <Text mb="md">Are you sure you want to cancel this call? This cannot be undone.</Text>
        {error && <Text c="red" size="sm" mb="sm">{error}</Text>}
        <Group justify="flex-end">
          <Button variant="default" onClick={close} disabled={loading}>Keep Call</Button>
          <Button color="red" loading={loading} onClick={handleCancel}>Cancel Call</Button>
        </Group>
      </Modal>

      <Stack gap="sm" mb="md">
        <TextInput
          placeholder="Search by patient name…"
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

      {filtered.length === 0 ? (
        <Text c="dimmed">No calls match your filters.</Text>
      ) : (
        <>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Patient</Table.Th>
                  <Table.Th>Date & Time</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginated.map((call) => {
                  const patientName =
                    call.patient.firstName || call.patient.lastName
                      ? `${call.patient.firstName ?? ''} ${call.patient.lastName ?? ''}`.trim()
                      : call.patient.email;

                  return (
                    <Table.Tr key={call.id}>
                      <Table.Td>{patientName}</Table.Td>
                      <Table.Td>{new Date(call.scheduledAt).toLocaleString()}</Table.Td>
                      <Table.Td>
                        <Badge color={call.status === 'scheduled' ? 'green' : 'gray'}>
                          {call.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button component={Link} href={`${basePath}/${call.id}`} size="xs" variant="default">
                            View
                          </Button>
                          {call.status === 'scheduled' && (
                            <Button size="xs" color="red" variant="outline" onClick={() => openCancel(call.id)}>
                              Cancel
                            </Button>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
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
      )}
    </>
  );
}
