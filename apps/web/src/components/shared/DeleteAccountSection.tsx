'use client';

import { useState } from 'react';
import { Paper, Title, Text, Button, Modal, Group, Stack, Alert } from '@mantine/core';
import { signOut } from 'next-auth/react';

export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDelete = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Could not delete your account.');
        setLoading(false);
        return;
      }
      await signOut({ callbackUrl: '/login' });
    } catch {
      setError('Unexpected error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Paper withBorder p="lg" radius="md" mt="lg" style={{ borderColor: 'var(--mantine-color-red-4)' }}>
      <Title order={4} mb="xs" c="red">Delete account</Title>
      <Text size="sm" c="dimmed" mb="md">
        Permanently closes your account and signs you out everywhere. Medical records are
        retained only as long as the law requires, then deleted. This can&apos;t be undone.
      </Text>
      <Button color="red" variant="outline" onClick={() => setOpen(true)}>
        Delete account
      </Button>

      <Modal opened={open} onClose={() => setOpen(false)} title="Delete your account?" centered>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          <Text size="sm">
            This can&apos;t be undone. You&apos;ll be signed out and your account will be closed.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button color="red" loading={loading} onClick={onDelete}>
              Delete account
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
