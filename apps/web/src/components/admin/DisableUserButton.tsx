"use client";

import { useState } from "react";
import { Button, Modal, Stack, Text, Alert, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLock, IconLockOpen } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface DisableUserButtonProps {
  userId: string;
  userName: string;
  disabled: boolean;
}

export default function DisableUserButton({ userId, userName, disabled }: DisableUserButtonProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const action = disabled ? "reinstate" : "suspend";

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/users/${userId}/disable`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: !disabled }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    close();
    router.refresh();
  }

  return (
    <>
      <Button
        variant="subtle"
        color={disabled ? "teal" : "red"}
        leftSection={disabled ? <IconLockOpen size={15} /> : <IconLock size={15} />}
        onClick={open}
      >
        {disabled ? "Reinstate Account" : "Suspend Account"}
      </Button>

      <Modal
        opened={opened}
        onClose={close}
        title={disabled ? "Reinstate Account" : "Suspend Account"}
        centered
        size="sm"
      >
        <Stack>
          {error && <Alert color="red" variant="light">{error}</Alert>}
          <Text size="sm">
            {disabled ? (
              <>Are you sure you want to reinstate <strong>{userName}</strong>? They will regain access to their account.</>
            ) : (
              <>Are you sure you want to suspend <strong>{userName}</strong>? They will be logged out and unable to access their account until reinstated.</>
            )}
          </Text>
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={close}>Cancel</Button>
            <Button
              color={disabled ? "teal" : "red"}
              loading={loading}
              onClick={handleConfirm}
            >
              {disabled ? "Yes, Reinstate" : "Yes, Suspend"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
