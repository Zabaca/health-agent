'use client';

import { useState, useMemo } from 'react';
import { Table, Badge, Anchor, Text, Group, ActionIcon, Modal, TextInput, Button, Stack, Combobox, useCombobox, InputBase, ScrollArea, MultiSelect, Pagination, Select } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import classes from './MyRecordsTable.module.css';

export interface MyRecordRow {
  id: string;
  createdAt: string;
  fileType: string;
  fileURL: string;
  originalName: string | null;
  releaseCode: string | null;
  pagecount: number | null;
  uploadedBy: string | null;
}

interface ReleaseOption {
  id: string;
  releaseCode: string;
  providerNames: string[];
}

export interface ProviderOption {
  /** Display name (insurance/insurance plan or provider name). */
  name: string;
  /** Release codes that include this provider — selecting the option matches
      records tagged with any of these codes. */
  releaseCodes: string[];
}

interface Props {
  rows: MyRecordRow[];
  releases?: ReleaseOption[];
  providers?: ProviderOption[];
  readOnly?: boolean;
}

function fuzzyMatch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const haystack = fields.filter(Boolean).join(' ').toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

function comboFuzzy(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

interface ReleaseSelectProps {
  value: string | null;
  onChange: (val: string | null) => void;
  options: ReleaseOption[];
}

function ReleaseSelect({ value, onChange, options }: ReleaseSelectProps) {
  const [search, setSearch] = useState('');
  const combobox = useCombobox({
    onDropdownClose: () => { combobox.resetSelectedOption(); setSearch(''); },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter(o => {
      const combined = [o.releaseCode, ...o.providerNames].join(' ');
      return comboFuzzy(search, combined);
    });
  }, [search, options]);

  const selected = options.find(o => o.releaseCode === value);
  const displayValue = selected
    ? `${selected.releaseCode}${selected.providerNames.length ? ` — ${selected.providerNames.join(', ')}` : ''}`
    : '';

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={val => { onChange(val); combobox.closeDropdown(); }}
    >
      <Combobox.Target>
        <InputBase
          label="Associate with Release (optional)"
          placeholder="Search by code or provider…"
          value={combobox.dropdownOpened ? search : displayValue}
          onChange={e => { setSearch(e.currentTarget.value); combobox.openDropdown(); }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize mah={200} type="scroll">
            {filtered.length === 0 ? (
              <Combobox.Empty>No releases found</Combobox.Empty>
            ) : filtered.map(o => (
              <Combobox.Option key={o.releaseCode} value={o.releaseCode} active={value === o.releaseCode}>
                <Group gap="xs" wrap="nowrap">
                  <Text size="sm" fw={500} ff="monospace">{o.releaseCode}</Text>
                  {o.providerNames.length > 0 && (
                    <Text size="xs" c="dimmed" truncate>{o.providerNames.join(', ')}</Text>
                  )}
                </Group>
              </Combobox.Option>
            ))}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default function MyRecordsTable({ rows, releases = [], providers = [], readOnly = false }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [fileTypeFilter, setFileTypeFilter] = useState<string[]>([]);
  const [providerFilter, setProviderFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fileTypeOptions = useMemo(() =>
    Array.from(new Set(rows.map(r => r.fileType.toUpperCase()))).sort().map(t => ({ value: t, label: t })),
    [rows],
  );

  // Provider name → set of releaseCodes. A provider may appear across multiple
  // releases; selecting one option matches files tagged with any of those
  // codes (mirrors the mobile filter).
  const providerReleaseCodes = useMemo(() => {
    if (providerFilter.length === 0) return null;
    const selected = new Set(providerFilter);
    const codes = new Set<string>();
    for (const p of providers) {
      if (selected.has(p.name)) {
        for (const c of p.releaseCodes) codes.add(c);
      }
    }
    return codes;
  }, [providerFilter, providers]);

  const filtered = useMemo(() => {
    const [from, to] = dateRange;
    return rows.filter(r => {
      if (!fuzzyMatch(search, r.originalName, r.uploadedBy, r.releaseCode)) return false;

      const created = new Date(r.createdAt);
      if (from) { const s = new Date(from); s.setHours(0, 0, 0, 0); if (created < s) return false; }
      if (to)   { const e = new Date(to);   e.setHours(23, 59, 59, 999); if (created > e) return false; }

      if (fileTypeFilter.length > 0 && !fileTypeFilter.includes(r.fileType.toUpperCase())) return false;

      if (providerReleaseCodes && (!r.releaseCode || !providerReleaseCodes.has(r.releaseCode))) return false;

      return true;
    });
  }, [rows, search, dateRange, fileTypeFilter, providerReleaseCodes]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const [editRow, setEditRow] = useState<MyRecordRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editReleaseCode, setEditReleaseCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  const [deleteRow, setDeleteRow] = useState<MyRecordRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  function handleEditClick(row: MyRecordRow) {
    setEditRow(row);
    setEditName(row.originalName ?? '');
    setEditReleaseCode(row.releaseCode);
    openEdit();
  }

  function handleDeleteClick(row: MyRecordRow) {
    setDeleteRow(row);
    openDelete();
  }

  async function handleSave() {
    if (!editRow) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${editRow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: editName.trim() || editRow.originalName, releaseCode: editReleaseCode }),
      });
      if (!res.ok) throw new Error('Failed to save');
      closeEdit();
      router.refresh();
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to save changes', color: 'red' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteRow.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      closeDelete();
      router.refresh();
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to delete file', color: 'red' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Stack gap="sm" mb="md">
        <TextInput
          placeholder="Search file name, uploaded by, or release code…"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
        />
        {providers.length > 0 ? (
          <MultiSelect
            placeholder="Filter by provider"
            data={providers.map(p => ({ value: p.name, label: p.name }))}
            value={providerFilter}
            onChange={(val) => { setProviderFilter(val); setPage(1); }}
            clearable
            searchable
          />
        ) : null}
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
            placeholder="Filter by file type"
            data={fileTypeOptions}
            value={fileTypeFilter}
            onChange={(val) => { setFileTypeFilter(val); setPage(1); }}
            clearable
          />
        </Group>
      </Stack>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>File Name</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Release Code</Table.Th>
            <Table.Th>Uploaded By</Table.Th>
            <Table.Th className={classes.hideOnMobile}>Pages</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={7} style={{ textAlign: 'center', color: 'var(--mantine-color-dimmed)' }}>
                No records yet.
              </Table.Td>
            </Table.Tr>
          ) : filtered.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={7} style={{ textAlign: 'center', color: 'var(--mantine-color-dimmed)' }}>
                No records match your filters.
              </Table.Td>
            </Table.Tr>
          ) : paginated.map(r => (
            <Table.Tr key={r.id}>
              <Table.Td>
                {r.fileType === 'zip' ? (
                  <Anchor href={r.fileURL} download={r.originalName ?? true} size="sm">
                    {r.originalName ?? '—'}
                  </Anchor>
                ) : (
                  <Anchor component={Link} href={`/my-records/${r.id}`} size="sm">
                    {r.originalName ?? '—'}
                  </Anchor>
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm">{new Date(r.createdAt).toLocaleDateString()}</Text>
              </Table.Td>
              <Table.Td>
                <Badge variant="light" size="sm">{r.fileType.toUpperCase()}</Badge>
              </Table.Td>
              <Table.Td>
                {r.releaseCode
                  ? <Badge variant="outline" size="sm" color="blue">{r.releaseCode}</Badge>
                  : '—'
                }
              </Table.Td>
              <Table.Td>
                <Text size="sm">{r.uploadedBy ?? '—'}</Text>
              </Table.Td>
              <Table.Td className={classes.hideOnMobile}>{r.pagecount ?? '—'}</Table.Td>
              <Table.Td>
                {!readOnly && (
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon variant="subtle" size="sm" onClick={() => handleEditClick(r)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDeleteClick(r)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                )}
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
            data={['5', '20', '50', '100']}
            w={80}
            size="xs"
          />
          <Text size="sm" c="dimmed">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</Text>
        </Group>
        <Pagination total={totalPages} value={currentPage} onChange={setPage} size="sm" />
      </Group>

      {/* Edit Modal */}
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Record" size="sm" centered>
        <Stack gap="md">
          <TextInput
            label="File Name"
            value={editName}
            onChange={e => setEditName(e.currentTarget.value)}
            placeholder="Enter file name"
          />
          {releases.length > 0 && (
            <ReleaseSelect
              value={editReleaseCode}
              onChange={setEditReleaseCode}
              options={releases}
            />
          )}
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeEdit} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="Delete Record" size="sm" centered>
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete <strong>{deleteRow?.originalName ?? 'this file'}</strong>? This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeDelete} disabled={deleting}>Cancel</Button>
            <Button color="red" onClick={handleDelete} loading={deleting}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
