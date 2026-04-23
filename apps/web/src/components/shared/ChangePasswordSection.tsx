'use client';

import { useState } from 'react';
import { Paper, Title, PasswordInput, Button, Stack, Text, Group } from '@mantine/core';

export default function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/password/change', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to update password.');
        return;
      }
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper withBorder p="lg" radius="md" mt="lg">
      <Title order={4} mb="md">Change Password</Title>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <PasswordInput
            label="Current Password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label="New Password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label="Confirm New Password"
            placeholder="Repeat new password"
            value={confirm}
            onChange={(e) => setConfirm(e.currentTarget.value)}
            required
          />
          {error && <Text c="red" size="sm">{error}</Text>}
          {success && <Text c="green" size="sm">Password updated successfully.</Text>}
          <Group>
            <Button type="submit" loading={saving}>
              Update Password
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
