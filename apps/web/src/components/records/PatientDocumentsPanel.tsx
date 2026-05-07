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
  userProviderId: string | null;
  providerName: string | null;
  source: string;
  uploadedBy: string | null;
}

interface ProviderOption {
  id: string;
  name: string;
}

interface Props {
  patientId: string;
  role: 'admin' | 'agent';
  documents: PatientDocumentRow[];
  providers?: ProviderOption[];
  recordsBasePath: string;
}


interface ProviderSelectProps {
  value: string | null;
  onChange: (val: string | null) => void;
  options: ProviderOption[];
}

function ProviderSelect({ value, onChange, options }: ProviderSelectProps) {
  const [search, setSearch] = useState('');
  const combobox = useCombobox({
    onDropdownClose: () => { combobox.resetSelectedOption(); setSearch(''); },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => {
      const t = (o.name ?? '').toLowerCase();
      let qi = 0;
      for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) qi++;
      }
      return qi === q.length;
    });
  }, [search, options]);

  const selected = options.find(o => o.id === value);

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={val => { onChange(val === '__none__' ? null : val); combobox.closeDropdown(); }}
    >
      <Combobox.Target>
        <InputBase
          label="Associate with Provider (optional)"
          placeholder="Search providers…"
          value={combobox.dropdownOpened ? search : (selected?.name ?? '')}
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
            <Combobox.Option value="__none__" active={value === null}>
              <Text size="sm" c="dimmed">None</Text>
            </Combobox.Option>
            {filtered.length === 0 ? (
              <Combobox.Empty>No providers found</Combobox.Empty>
            ) : filtered.map(o => (
              <Combobox.Option key={o.id} value={o.id} active={value === o.id}>
                <Text size="sm">{o.name}</Text>
              </Combobox.Option>
            ))}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default function PatientDocumentsPanel({ patientId, documents, providers, recordsBasePath }: Props) {
  const router = useRouter();

  // Edit state
  const [editDoc, setEditDoc] = useState<PatientDocumentRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editProviderId, setEditProviderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  // Delete state
  const [deleteDoc, setDeleteDoc] = useState<PatientDocumentRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  function handleEditClick(doc: PatientDocumentRow) {
    setEditDoc(doc);
    setEditName(doc.originalName ?? '');
    setEditProviderId(doc.userProviderId);
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
        body: JSON.stringify({ originalName: editName.trim() || editDoc.originalName, userProviderId: editProviderId }),
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
        <UploadFileButton patientId={patientId} providers={providers} />
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
              <Table.Th>Provider</Table.Th>
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
                  {doc.providerName
                    ? <Badge variant="outline" size="sm" color="blue">{doc.providerName}</Badge>
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
          {(providers ?? []).length > 0 && (
            <ProviderSelect
              value={editProviderId}
              onChange={setEditProviderId}
              options={providers ?? []}
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
