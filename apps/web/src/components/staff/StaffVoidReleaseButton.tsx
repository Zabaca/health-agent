"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, Text, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBan } from "@tabler/icons-react";
import { apiClient } from "@/lib/api/client";

interface Props {
  mode: 'admin' | 'agent';
  patientId: string;
  releaseId: string;
}

export default function StaffVoidReleaseButton({ mode, patientId, releaseId }: Props) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [voiding, setVoiding] = useState(false);

  const handleVoid = async () => {
    setVoiding(true);
    try {
      const result = mode === 'admin'
        ? await apiClient.admin.patientReleases.void({ params: { id: patientId, releaseId } })
        : await apiClient.agent.patientReleases.void({ params: { id: patientId, releaseId } });

      if (result.status !== 200) {
        notifications.show({ title: "Error", message: "Failed to void release", color: "red" });
        return;
      }
      notifications.show({ title: "Voided", message: "Release has been voided", color: "orange" });
      router.refresh();
    } catch {
      notifications.show({ title: "Error", message: "Unexpected error. Please try again.", color: "red" });
    } finally {
      setVoiding(false);
      setOpened(false);
    }
  };

  return (
    <>
      <Button color="orange" variant="light" leftSection={<IconBan size={16} />} onClick={() => setOpened(true)}>
        Void Release
      </Button>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Void Release" centered>
        <Text mb="xs">Are you sure you want to void this release form?</Text>
        <Text mb="lg" c="dimmed" size="sm">
          This action cannot be undone. If you need to submit a new request, you will need to create a new release form.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setOpened(false)}>Cancel</Button>
          <Button color="orange" loading={voiding} onClick={handleVoid}>Void</Button>
        </Group>
      </Modal>
    </>
  );
}
