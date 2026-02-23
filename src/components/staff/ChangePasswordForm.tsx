"use client";

import { useState } from "react";
import { Paper, Title, PasswordInput, Button, Stack, Text } from "@mantine/core";
import { useSession } from "next-auth/react";

interface Props {
  onSave: (password: string) => Promise<{ ok: boolean }>;
  redirectPath: string;
}

export default function ChangePasswordForm({ onSave, redirectPath }: Props) {
  const { update } = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const result = await onSave(password);
      if (result.ok) {
        await update({ mustChangePassword: false });
        window.location.href = redirectPath;
      } else {
        setError("Failed to change password. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper withBorder p="xl" radius="md" maw={480} mx="auto" mt="xl">
      <Title order={3} mb="md">Change Password</Title>
      <Text size="sm" c="dimmed" mb="lg">
        You must set a new password before continuing.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <PasswordInput
            label="New Password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Repeat new password"
            value={confirm}
            onChange={(e) => setConfirm(e.currentTarget.value)}
            required
          />
          {error && <Text c="red" size="sm">{error}</Text>}
          <Button type="submit" loading={saving} fullWidth>
            Set Password
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
