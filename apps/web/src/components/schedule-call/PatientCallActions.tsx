"use client";

import { useState } from "react";
import { Group, Button, Alert, Stack } from "@mantine/core";
import Link from "next/link";
import CancelCallButton from "./CancelCallButton";
import AddToCalendarMenu from "./AddToCalendarMenu";

interface Props {
  callId: string;
  scheduledAt: string;
  canReschedule: boolean;
}

export default function PatientCallActions({ callId, scheduledAt, canReschedule }: Props) {
  const [error, setError] = useState('');

  return (
    <Stack gap="sm">
      {error && <Alert color="red">{error}</Alert>}
      {canReschedule && (
        <AddToCalendarMenu callId={callId} scheduledAt={scheduledAt} />
      )}
      <Group>
        <Button component={Link} href="/scheduled-calls" variant="default" size="sm">
          Back to List
        </Button>
        {canReschedule && (
          <>
            <Button component={Link} href={`/scheduled-calls/${callId}/reschedule`} size="sm">
              Reschedule
            </Button>
            <CancelCallButton callId={callId} onError={setError} />
          </>
        )}
      </Group>
    </Stack>
  );
}
