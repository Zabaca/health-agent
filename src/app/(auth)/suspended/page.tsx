"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { Center, Paper, Stack, Title, Text, Button } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";

export default function SuspendedPage() {
  useEffect(() => {
    // Sign the user out so the session is cleared
    signOut({ redirect: false });
  }, []);

  return (
    <Center style={{ minHeight: "100vh", padding: "24px 16px" }}>
      <Paper p="xl" radius="md" withBorder style={{ maxWidth: 480, width: "100%" }}>
        <Stack align="center" gap="md">
          <IconLock size={48} color="var(--mantine-color-red-6)" />
          <Title order={3} ta="center">Account Suspended</Title>
          <Text c="dimmed" ta="center" size="sm">
            Your account has been suspended by an administrator. If you believe this is a mistake,
            please contact support.
          </Text>
          <Button variant="subtle" onClick={() => window.location.replace("/login")}>
            Back to Login
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
