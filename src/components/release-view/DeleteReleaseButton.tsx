"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, Text, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";

interface Props {
  releaseId: string;
}

export default function DeleteReleaseButton({ releaseId }: Props) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/releases/${releaseId}`, { method: "DELETE" });
      if (!res.ok) {
        notifications.show({ title: "Error", message: "Failed to delete release", color: "red" });
        return;
      }
      notifications.show({ title: "Deleted", message: "Release deleted successfully", color: "green" });
      router.push("/dashboard");
      router.refresh();
    } catch {
      notifications.show({ title: "Error", message: "Unexpected error. Please try again.", color: "red" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={() => setOpened(true)}>
        Delete
      </Button>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Confirm Deletion" centered>
        <Text mb="lg">Are you sure you want to delete this release? This action cannot be undone.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setOpened(false)}>Cancel</Button>
          <Button color="red" loading={deleting} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </>
  );
}
