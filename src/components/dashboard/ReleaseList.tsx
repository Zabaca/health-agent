"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Button,
  Group,
  Text,
  Modal,
  ActionIcon,
  Tooltip,
  Badge,
  Pagination,
  Select,
  TextInput,
  MultiSelect,
  Stack,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconEye, IconBan, IconSearch } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import type { ReleaseSummary } from "@/types/release";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import classes from "./ReleaseList.module.css";

const PAGE_SIZE_OPTIONS = ["5", "20", "50", "100"];
const DEFAULT_PAGE_SIZE = 5;

const STATUS_OPTIONS = [
  { value: "signed", label: "Signed" },
  { value: "pending", label: "Signature Required" },
  { value: "voided", label: "Voided" },
];

function getStatus(r: ReleaseSummary): "signed" | "pending" | "voided" {
  if (r.voided) return "voided";
  if (!r.authSignatureImage) return "pending";
  return "signed";
}

function fuzzyMatch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  // Each space-separated token must appear somewhere in the combined fields
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

interface Props {
  releases: ReleaseSummary[];
}

export default function ReleaseList({ releases }: Props) {
  const router = useRouter();
  const [voidId, setVoidId] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const handleVoid = async () => {
    if (!voidId) return;
    setVoiding(true);
    try {
      const result = await apiClient.releases.void({ params: { id: voidId } });
      if (result.status !== 200) {
        notifications.show({ title: "Error", message: "Failed to void release", color: "red" });
        return;
      }
      notifications.show({ title: "Voided", message: "Release has been voided", color: "orange" });
      setVoidId(null);
      router.refresh();
    } catch {
      notifications.show({ title: "Error", message: "Unexpected error. Please try again.", color: "red" });
    } finally {
      setVoiding(false);
    }
  };

  const filtered = useMemo(() => {
    const [from, to] = dateRange;
    return releases.filter((r) => {
      // Fuzzy search across provider names, authorized agent, release code
      if (
        !fuzzyMatch(
          search,
          r.providerNames.join(" "),
          r.authAgentFirstName,
          r.authAgentLastName,
          r.releaseCode,
        )
      ) return false;

      // Date range filter — compare against local-time day boundaries
      const created = new Date(r.createdAt);
      if (from) {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        if (created < start) return false;
      }
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(getStatus(r))) return false;

      return true;
    });
  }, [releases, search, dateRange, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (releases.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No releases yet.{" "}
        <Link href="/releases/new" style={{ color: "inherit" }}>
          Create your first release
        </Link>
        .
      </Text>
    );
  }

  return (
    <>
      <Stack gap="sm" mb="md">
        <TextInput
          placeholder="Search provider, authorized agent, or release code…"
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
        <Text c="dimmed" ta="center" py="xl">No releases match your filters.</Text>
      ) : (
        <>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th className={classes.hideOnMobile}>Patient Name</Table.Th>
                <Table.Th>Provider</Table.Th>
                <Table.Th>Authorized Agent</Table.Th>
                <Table.Th>Release Code</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th className={classes.hideOnMobile}>Last Updated</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginated.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td className={classes.hideOnMobile}>{r.firstName} {r.lastName}</Table.Td>
                  <Table.Td>
                    {r.providerNames.length > 0 ? (
                      <Text size="sm">{r.providerNames.join(", ")}</Text>
                    ) : (
                      <Text size="sm" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {r.releaseAuthAgent && (r.authAgentFirstName || r.authAgentLastName) ? (
                      <Text size="sm">{[r.authAgentFirstName, r.authAgentLastName].filter(Boolean).join(" ")}</Text>
                    ) : (
                      <Text size="sm" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {r.releaseCode ? (
                      <Text size="sm" ff="monospace">{r.releaseCode}</Text>
                    ) : (
                      <Text size="sm" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
                  <Table.Td className={classes.hideOnMobile}>{new Date(r.updatedAt).toLocaleString()}</Table.Td>
                  <Table.Td>
                    {r.voided ? (
                      <Badge color="gray" variant="light">Voided</Badge>
                    ) : !r.authSignatureImage ? (
                      <Badge color="yellow" variant="light">Signature Required</Badge>
                    ) : (
                      <Badge color="green" variant="light">Signed</Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View">
                        <ActionIcon component={Link} href={`/releases/${r.id}`} variant="light">
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      {!r.voided && (
                        <Tooltip label="Void">
                          <ActionIcon variant="light" color="orange" onClick={() => setVoidId(r.id)}>
                            <IconBan size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
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
                data={PAGE_SIZE_OPTIONS}
                w={80}
                size="xs"
              />
              <Text size="sm" c="dimmed">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </Text>
            </Group>
            <Pagination total={totalPages} value={currentPage} onChange={setPage} size="sm" />
          </Group>
        </>
      )}

      <Modal opened={!!voidId} onClose={() => setVoidId(null)} title="Void Release" centered>
        <Text mb="xs">Are you sure you want to void this release form?</Text>
        <Text mb="lg" c="dimmed" size="sm">
          This action cannot be undone. If you need to submit a new request, you will need to create a new release form.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setVoidId(null)}>Cancel</Button>
          <Button color="orange" loading={voiding} onClick={handleVoid}>Void</Button>
        </Group>
      </Modal>
    </>
  );
}
