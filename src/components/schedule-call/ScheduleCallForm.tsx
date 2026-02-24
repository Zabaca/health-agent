"use client";

import { useState } from "react";
import { Button, Paper, Title, Text, Stack, Alert, Group } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import TimeGrid from "./TimeGrid";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { errorSchema } from "@/lib/api/response-schemas";

interface AgentInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  address: string | null;
}

interface Props {
  agentInfo: AgentInfo;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minTimeForDate(date: Date | null): string | undefined {
  if (!date || !isSameDay(date, new Date())) return undefined;
  const t = new Date(Date.now() + 60 * 60 * 1000);
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

export default function ScheduleCallForm({ agentInfo }: Props) {
  const router = useRouter();
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const agentName =
    agentInfo.firstName || agentInfo.lastName
      ? `${agentInfo.firstName ?? ''} ${agentInfo.lastName ?? ''}`.trim()
      : agentInfo.email;

  const onSubmit = async () => {
    setError('');

    if (!date || !time) {
      setError('Please select a date and time.');
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    if (scheduledAt <= oneHourFromNow) {
      setError('Please schedule at least 1 hour in the future.');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.scheduledCalls.create({
        body: { scheduledAt: scheduledAt.toISOString() },
      });

      if (result.status === 201) {
        router.push('/scheduled-calls');
      } else {
        setError(errorSchema.safeParse(result.body).data?.error ?? 'Failed to schedule call. Please try again.');
      }
    } catch {
      setError('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack>
      <Paper withBorder p="lg" radius="md" maw={500}>
        <Title order={4} mb="sm">Your Agent</Title>
        <Stack gap="xs">
          <Text fw={500}>{agentName}</Text>
          <Text size="sm" c="dimmed">{agentInfo.email}</Text>
          {agentInfo.phoneNumber && <Text size="sm">{agentInfo.phoneNumber}</Text>}
          {agentInfo.address && <Text size="sm">{agentInfo.address}</Text>}
        </Stack>
      </Paper>

      <Paper withBorder p="lg" radius="md" maw={500}>
        <Title order={4} mb="sm">Select Date & Time</Title>

        {error && (
          <Alert color="red" mb="md">
            {error}
          </Alert>
        )}

        <Stack>
          <DatePickerInput
            label="Date"
            placeholder="Pick a date"
            value={date}
            onChange={setDate}
            minDate={new Date()}
            required
            mb="sm"
          />
          <Text size="sm" fw={500} mb={4}>Time</Text>
          <TimeGrid
            value={time}
            onChange={setTime}
            minTime={minTimeForDate(date)}
          />

          <Group>
            <Button onClick={onSubmit} loading={loading}>
              Schedule Call
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
