'use client';

import { useState } from 'react';
import { PasswordInput, Button, Paper, Title, Text, Anchor, Alert, Stack, Center } from '@mantine/core';
import Link from 'next/link';

interface Props {
  token: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Center mih="100vh">
        <Paper shadow="md" p={40} w={420} radius="md">
          <Title order={2} mb="md" ta="center">Invalid Link</Title>
          <Text size="sm" c="dimmed" ta="center" mb="md">
            This reset link is missing or invalid.
          </Text>
          <Anchor component={Link} href="/forgot-password" size="sm" ta="center" display="block">
            Request a new link
          </Anchor>
        </Paper>
      </Center>
    );
  }

  return (
    <Center mih="100vh">
      <Paper shadow="md" p={40} w={420} radius="md">
        <Title order={2} mb="xs" ta="center">Set a new password</Title>

        {done ? (
          <Stack gap="md" mt="md">
            <Text size="sm" ta="center" c="dimmed">
              Your password has been updated. You can now sign in with your new password.
            </Text>
            <Anchor component={Link} href="/login" size="sm" ta="center">
              Sign in
            </Anchor>
          </Stack>
        ) : (
          <>
            <Text c="dimmed" size="sm" ta="center" mb="lg">
              Choose a new password for your account.
            </Text>
            {error && <Alert color="red" mb="md">{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <Stack>
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
                <Button type="submit" fullWidth loading={loading} mt="sm">
                  Update Password
                </Button>
              </Stack>
            </form>
          </>
        )}
      </Paper>
    </Center>
  );
}
