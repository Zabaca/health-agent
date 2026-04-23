'use client';

import { useState } from 'react';
import { TextInput, Button, Paper, Title, Text, Anchor, Alert, Stack, Center } from '@mantine/core';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError('Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh">
      <Paper shadow="md" p={40} w={420} radius="md">
        <Title order={2} mb="xs" ta="center">Forgot your password?</Title>

        {submitted ? (
          <Stack gap="md" mt="md">
            <Text size="sm" ta="center" c="dimmed">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. Check your inbox.
            </Text>
            <Anchor component={Link} href="/login" size="sm" ta="center">
              Back to sign in
            </Anchor>
          </Stack>
        ) : (
          <>
            <Text c="dimmed" size="sm" ta="center" mb="lg">
              Enter your email and we&apos;ll send you a reset link.
            </Text>
            {error && <Alert color="red" mb="md">{error}</Alert>}
            <form onSubmit={handleSubmit}>
              <Stack>
                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  required
                />
                <Button type="submit" fullWidth loading={loading} mt="sm">
                  Send Reset Link
                </Button>
                <Anchor component={Link} href="/login" size="sm" ta="center">
                  Back to sign in
                </Anchor>
              </Stack>
            </form>
          </>
        )}
      </Paper>
    </Center>
  );
}
