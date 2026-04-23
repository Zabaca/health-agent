"use client";

import { useState } from "react";
import { Button, Modal, Text, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { errorSchema } from "@/lib/api/response-schemas";

interface Props {
  callId: string;
  onError?: (msg: string) => void;
}

export default function CancelCallButton({ callId, onError }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const result = await apiClient.scheduledCalls.update({
        params: { id: callId },
        body: { status: 'cancelled' },
      });
      if (result.status === 200) {
        router.push('/scheduled-calls');
      } else {
        close();
        onError?.(errorSchema.safeParse(result.body).data?.error ?? 'Failed to cancel. Please try again.');
      }
    } catch {
      close();
      onError?.('Unexpected error. Please try again.');
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

      <Button color="red" variant="outline" size="sm" onClick={open}>
        Cancel Call
      </Button>
    </>
  );
}
