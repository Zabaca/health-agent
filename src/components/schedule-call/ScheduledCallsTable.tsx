"use client";

import { useState, useMemo } from "react";
import { Table, Badge, Anchor, Text, Paper, Button, Group, MultiSelect, Select, Pagination } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import Link from "next/link";

interface Agent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  address: string | null;
}

interface ScheduledCall {
  id: string;
  scheduledAt: string;
  status: 'scheduled' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  agent: Agent;
}

interface Props {
  calls: ScheduledCall[];
}

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ScheduledCallsTable({ calls }: Props) {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filtered = useMemo(() => {
    const [from, to] = dateRange;
    return calls.filter((call) => {
      const scheduled = new Date(call.scheduledAt);
      if (from) {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        if (scheduled < start) return false;
      }
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (scheduled > end) return false;
      }
      if (statusFilter.length > 0 && !statusFilter.includes(call.status)) return false;
      return true;
    });
  }, [calls, dateRange, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (calls.length === 0) {
    return <Text c="dimmed">No scheduled calls yet.</Text>;
  }

  return (
    <>
      <Group gap="sm" grow mb="md">
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

      {filtered.length === 0 ? (
        <Text c="dimmed">No calls match your filters.</Text>
      ) : (
        <>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Agent</Table.Th>
                  <Table.Th>Date & Time</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginated.map((call) => {
                  const agentName =
                    call.agent.firstName || call.agent.lastName
                      ? `${call.agent.firstName ?? ""} ${call.agent.lastName ?? ""}`.trim()
                      : call.agent.email;

                  return (
                    <Table.Tr key={call.id}>
                      <Table.Td>{agentName}</Table.Td>
                      <Table.Td>{new Date(call.scheduledAt).toLocaleString()}</Table.Td>
                      <Table.Td>
                        <Badge color={call.status === 'scheduled' ? 'green' : 'gray'}>
                          {call.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Anchor component={Link} href={`/scheduled-calls/${call.id}`} size="sm">
                            View
                          </Anchor>
                          {call.status === 'scheduled' && (
                            <Button
                              component={Link}
                              href={`/scheduled-calls/${call.id}/reschedule`}
                              size="xs"
                              variant="light"
                            >
                              Reschedule
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
