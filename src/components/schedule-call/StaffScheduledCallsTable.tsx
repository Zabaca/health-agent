"use client";

import { useState } from "react";
import { Table, Badge, Text, Paper, Button, Group, Modal } from "@mantine/core";
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

export default function StaffScheduledCallsTable({ calls, basePath }: Props) {
  const router = useRouter();
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [opened, { open, close }] = useDisclosure(false);

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

  if (calls.length === 0) {
    return <Text c="dimmed">No scheduled calls yet.</Text>;
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title="Cancel Call"
        centered
      >
        <Text mb="md">Are you sure you want to cancel this call? This cannot be undone.</Text>
        {error && <Text c="red" size="sm" mb="sm">{error}</Text>}
        <Group justify="flex-end">
          <Button variant="default" onClick={close} disabled={loading}>Keep Call</Button>
          <Button color="red" loading={loading} onClick={handleCancel}>
            Cancel Call
          </Button>
        </Group>
      </Modal>

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
            {calls.map((call) => {
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
                      <Button
                        component={Link}
                        href={`${basePath}/${call.id}`}
                        size="xs"
                        variant="default"
                      >
                        View
                      </Button>
                      {call.status === 'scheduled' && (
                        <Button
                          size="xs"
                          color="red"
                          variant="outline"
                          onClick={() => openCancel(call.id)}
                        >
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
    </>
  );
}
