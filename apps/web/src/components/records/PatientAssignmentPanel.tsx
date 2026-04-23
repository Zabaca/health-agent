'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextInput, Button, Table, Radio, Stack, Group,
  Text, Badge, Title, Divider, Loader, Center,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';

interface PatientResult {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  ssn_last4: string | null;
}

interface Props {
  fileId: string;
  currentPatientId: string | null;
  currentPatientName?: string | null;
  role: 'admin' | 'agent';
  listPath: string;
}

export default function PatientAssignmentPanel({
  fileId,
  currentPatientId,
  currentPatientName,
  role,
  listPath,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [ssnLast4, setSsnLast4] = useState('');
  const [results, setResults] = useState<PatientResult[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  const searchUrl = role === 'admin' ? '/api/admin/patients/search' : '/api/agent/patients/search';
  const patchUrl = role === 'admin' ? `/api/admin/records/${fileId}` : `/api/agent/records/${fileId}`;

  async function handleSearch() {
    setSearching(true);
    setResults(null);
    setSelectedId(null);
    try {
      const params = new URLSearchParams();
      if (name) params.set('name', name);
      if (dob) {
        const mm = String(dob.getMonth() + 1).padStart(2, '0');
        const dd = String(dob.getDate()).padStart(2, '0');
        const yyyy = dob.getFullYear();
        params.set('dob', `${mm}/${dd}/${yyyy}`);
      }
      if (ssnLast4) params.set('ssn', ssnLast4);

      const res = await fetch(`${searchUrl}?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      setResults(await res.json());
    } catch {
      notifications.show({ title: 'Error', message: 'Patient search failed', color: 'red' });
    } finally {
      setSearching(false);
    }
  }

  async function handleAssign() {
    if (!selectedId) return;
    setAssigning(true);
    try {
      const res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to assign');
      }
      notifications.show({ title: 'Assigned', message: 'File has been assigned to patient', color: 'green' });
      router.push(listPath);
      router.refresh();
    } catch (err) {
      notifications.show({ title: 'Error', message: err instanceof Error ? err.message : 'Failed to assign', color: 'red' });
    } finally {
      setAssigning(false);
    }
  }

  const isAssigned = !!currentPatientId && !showReassign;

  return (
    <Stack gap="md">
      <Title order={5}>Patient Assignment</Title>

      {currentPatientId && !showReassign ? (
        <Stack gap="xs">
          <Group gap="xs">
            <Text size="sm">Assigned to:</Text>
            <Badge color="green">{currentPatientName ?? currentPatientId}</Badge>
          </Group>
          {role === 'admin' && (
            <Button variant="subtle" size="xs" onClick={() => setShowReassign(true)}>
              Reassign
            </Button>
          )}
        </Stack>
      ) : (
        <>
          {currentPatientId && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">Currently assigned to: {currentPatientName ?? currentPatientId}</Text>
              <Button variant="subtle" size="xs" color="red" onClick={() => setShowReassign(false)}>Cancel</Button>
            </Group>
          )}

          <Stack gap="xs">
            <TextInput
              label="Name"
              placeholder="First or last name"
              value={name}
              onChange={e => setName(e.currentTarget.value)}
              size="sm"
            />
            <DatePickerInput
              label="Date of Birth"
              placeholder="Pick date"
              value={dob}
              onChange={setDob}
              size="sm"
              clearable
            />
            <TextInput
              label="SSN Last 4"
              placeholder="####"
              maxLength={4}
              value={ssnLast4}
              onChange={e => setSsnLast4(e.currentTarget.value.replace(/\D/g, ''))}
              size="sm"
            />
            <Button onClick={handleSearch} loading={searching} size="sm">Search</Button>
          </Stack>

          {searching && (
            <Center py="sm"><Loader size="sm" /></Center>
          )}

          {results !== null && !searching && (
            <>
              <Divider />
              {results.length === 0 ? (
                <Text size="sm" c="dimmed">No patients found.</Text>
              ) : (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th />
                        <Table.Th>Name</Table.Th>
                        <Table.Th>DOB</Table.Th>
                        <Table.Th>SSN</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {results.map(p => (
                        <Table.Tr
                          key={p.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedId(p.id)}
                        >
                          <Table.Td>
                            <Radio
                              checked={selectedId === p.id}
                              onChange={() => setSelectedId(p.id)}
                              readOnly
                            />
                          </Table.Td>
                          <Table.Td>
                            {[p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') || '—'}
                          </Table.Td>
                          <Table.Td>{p.dateOfBirth ?? '—'}</Table.Td>
                          <Table.Td>
                            {p.ssn_last4 ? `XXX-XX-${p.ssn_last4}` : '—'}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>

                  <Button
                    onClick={handleAssign}
                    disabled={!selectedId}
                    loading={assigning}
                    size="sm"
                  >
                    Assign
                  </Button>
                </Stack>
              )}
            </>
          )}
        </>
      )}
    </Stack>
  );
}
