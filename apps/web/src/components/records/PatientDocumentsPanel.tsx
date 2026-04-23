'use client';

import { useState, useMemo } from 'react';
import { Table, Badge, Title, Group, Anchor, Text, Paper, ActionIcon, Modal, TextInput, Button, Stack, Combobox, useCombobox, InputBase, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UploadFileButton from './UploadFileButton';

export interface PatientDocumentRow {
  id: string;
  createdAt: string;
  fileType: string;
  fileURL: string;
  originalName: string | null;
  releaseCode: string | null;
  source: string;
  uploadedBy: string | null;
}

interface ReleaseOption {
  id: string;
  releaseCode: string | null;
  providerNames?: string[];
}

interface Props {
  patientId: string;
  role: 'admin' | 'agent';
  documents: PatientDocumentRow[];
  releases?: ReleaseOption[];
  recordsBasePath: string;
}

function fuzzyMatch(query: string, target: string): boolean {
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
  options: { releaseCode: string; providerNames: string[] }[];
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
      return fuzzyMatch(search, combined);
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

export default function PatientDocumentsPanel({ patientId, documents, releases, recordsBasePath }: Props) {
  const router = useRouter();

  // Edit state
  const [editDoc, setEditDoc] = useState<PatientDocumentRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editReleaseCode, setEditReleaseCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  // Delete state
  const [deleteDoc, setDeleteDoc] = useState<PatientDocumentRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const releaseOptions = (releases ?? [])
    .filter(r => r.releaseCode)
    .map(r => ({ releaseCode: r.releaseCode!, providerNames: r.providerNames ?? [] }));

  function handleEditClick(doc: PatientDocumentRow) {
    setEditDoc(doc);
    setEditName(doc.originalName ?? '');
    setEditReleaseCode(doc.releaseCode);
    openEdit();
  }

  function handleDeleteClick(doc: PatientDocumentRow) {
    setDeleteDoc(doc);
    openDelete();
  }

  async function handleSave() {
    if (!editDoc) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${editDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: editName.trim() || editDoc.originalName, releaseCode: editReleaseCode }),
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
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteDoc.id}`, { method: 'DELETE' });
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
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" align="center" mb="md">
        <Title order={4}>Records</Title>
        <UploadFileButton patientId={patientId} releases={releases} />
      </Group>

      {documents.length === 0 ? (
        <Text size="sm" c="dimmed">No documents yet.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>File Name</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Release Code</Table.Th>
              <Table.Th>Source</Table.Th>
              <Table.Th>Uploaded By</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {documents.map(doc => (
              <Table.Tr key={doc.id}>
                <Table.Td>
                  {doc.fileType === 'zip' ? (
                    <Anchor href={doc.fileURL} download={doc.originalName ?? true} size="sm">
                      {doc.originalName ?? '—'}
                    </Anchor>
                  ) : (
                    <Anchor component={Link} href={`${recordsBasePath}/${doc.id}`} size="sm">
                      {doc.originalName ?? '—'}
                    </Anchor>
                  )}
                </Table.Td>
                <Table.Td>{new Date(doc.createdAt).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  <Badge variant="light" size="sm">{doc.fileType.toUpperCase()}</Badge>
                </Table.Td>
                <Table.Td>
                  {doc.releaseCode
                    ? <Badge variant="outline" size="sm" color="blue">{doc.releaseCode}</Badge>
                    : '—'
                  }
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" size="sm" color="gray">{doc.source}</Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{doc.uploadedBy ?? '—'}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <ActionIcon variant="subtle" size="sm" onClick={() => handleEditClick(doc)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDeleteClick(doc)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* Edit Modal */}
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Document" size="sm" centered>
        <Stack gap="md">
          <TextInput
            label="File Name"
            value={editName}
            onChange={e => setEditName(e.currentTarget.value)}
            placeholder="Enter file name"
          />
          {releaseOptions.length > 0 && (
            <ReleaseSelect
              value={editReleaseCode}
              onChange={setEditReleaseCode}
              options={releaseOptions}
            />
          )}
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeEdit} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title="Delete Document" size="sm" centered>
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete <strong>{deleteDoc?.originalName ?? 'this file'}</strong>? This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeDelete} disabled={deleting}>Cancel</Button>
            <Button color="red" onClick={handleDelete} loading={deleting}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
