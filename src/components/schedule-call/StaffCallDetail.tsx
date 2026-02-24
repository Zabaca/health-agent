"use client";

import { useState } from "react";
import { Paper, Title, Text, Badge, Stack, Group, Button, Modal, Alert, SimpleGrid } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import SsnDisplay from "@/components/fields/SsnDisplay";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { errorSchema } from "@/lib/api/response-schemas";

interface Patient {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  email: string;
  dateOfBirth: string | null;
  address: string | null;
  phoneNumber: string | null;
  ssn: string | null;
}

interface Props {
  callId: string;
  patient: Patient;
  scheduledAt: string;
  status: 'scheduled' | 'cancelled';
  backHref: string;
  patientHref: string;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <Text size="xs" fw={500} c="dimmed" mb={2}>{label}</Text>
      <Text size="sm">{value}</Text>
    </div>
  );
}

export default function StaffCallDetail({ callId, patient, scheduledAt, status, backHref, patientHref }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [opened, { open, close }] = useDisclosure(false);

  const fullName = [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(' ') || patient.email;

  const handleCancel = async () => {
    setLoading(true);
    try {
      const result = await apiClient.staffScheduledCalls.cancel({
        params: { id: callId },
        body: { status: 'cancelled' },
      });
      if (result.status === 200) {
        router.push(backHref);
        router.refresh();
      } else {
        close();
        setError(errorSchema.safeParse(result.body).data?.error ?? 'Failed to cancel. Please try again.');
      }
    } catch {
      close();
      setError('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal opened={opened} onClose={close} title="Cancel Call" centered>
        <Text mb="md">Are you sure you want to cancel this call? This cannot be undone.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close} disabled={loading}>Keep Call</Button>
          <Button color="red" loading={loading} onClick={handleCancel}>
            Cancel Call
          </Button>
        </Group>
      </Modal>

      <Stack gap="md" maw={720}>
        {error && <Alert color="red">{error}</Alert>}

        <Paper withBorder p="lg" radius="md">
          <Group justify="space-between" align="center" mb="md">
            <Title order={4}>Patient Information</Title>
            <Button component={Link} href={patientHref} variant="light" size="xs">
              View Profile
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <InfoRow label="Full Name" value={fullName} />
            <InfoRow label="Email" value={patient.email} />
            <InfoRow label="Phone" value={patient.phoneNumber} />
            <InfoRow label="Date of Birth" value={patient.dateOfBirth} />
            <InfoRow label="Address" value={patient.address} />

            {patient.ssn && (
              <div>
                <Text size="xs" fw={500} c="dimmed" mb={2}>SSN</Text>
                <SsnDisplay ssn={patient.ssn} />
              </div>
            )}
          </SimpleGrid>
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Title order={4} mb="md">Call Details</Title>
          <Stack gap="sm">
            <InfoRow label="Scheduled For" value={new Date(scheduledAt).toLocaleString()} />
            <div>
              <Text size="xs" fw={500} c="dimmed" mb={2}>Status</Text>
              <Badge color={status === 'scheduled' ? 'green' : 'gray'}>{status}</Badge>
            </div>
          </Stack>
        </Paper>

        <Group>
          <Button component={Link} href={backHref} variant="default" size="sm">
            Back to List
          </Button>
          {status === 'scheduled' && (
            <Button color="red" variant="outline" size="sm" onClick={open}>
              Cancel Call
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
}
