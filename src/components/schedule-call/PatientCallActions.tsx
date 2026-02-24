"use client";

import { useState } from "react";
import { Group, Button, Alert } from "@mantine/core";
import Link from "next/link";
import CancelCallButton from "./CancelCallButton";

interface Props {
  callId: string;
  canReschedule: boolean;
}

export default function PatientCallActions({ callId, canReschedule }: Props) {
  const [error, setError] = useState('');

  return (
    <div>
      {error && <Alert color="red" mb="sm">{error}</Alert>}
      <Group>
        <Button component={Link} href="/scheduled-calls" variant="default" size="sm">
          Back to List
        </Button>
        {canReschedule && (
          <Button component={Link} href={`/scheduled-calls/${callId}/reschedule`} size="sm">
            Reschedule
          </Button>
        )}
        {canReschedule && (
          <CancelCallButton callId={callId} onError={setError} />
        )}
      </Group>
    </div>
  );
}
