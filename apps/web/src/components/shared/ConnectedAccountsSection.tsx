'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Paper, Title, Stack, Group, Text, Button, Alert } from '@mantine/core';

type Connections = {
  email: string | null;
  hasPassword: boolean;
  apple: boolean;
  google: boolean;
};

const LINK_ERROR_MESSAGES: Record<string, string> = {
  conflict: 'That account is already linked to a different Veladon account.',
  expired: 'The link request expired or was invalid. Please try again.',
  apple_https: 'Linking Apple requires HTTPS. (In local dev, run the ngrok-backed server.)',
};

export default function ConnectedAccountsSection({ returnTo = '/profile' }: { returnTo?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [conn, setConn] = useState<Connections | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/account/connections');
    if (res.ok) setConn(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Surface the result of the OAuth link round-trip (carried as a query param).
  useEffect(() => {
    if (params.get('linked')) setNotice('Account linked successfully.');
    const err = params.get('linkError');
    if (err) setError(LINK_ERROR_MESSAGES[err] ?? 'Could not link that account.');
    if (params.get('linked') || params.get('linkError')) {
      router.replace(returnTo);
    }
  }, [params, router, returnTo]);

  const unlink = async (provider: 'apple' | 'google') => {
    setError('');
    setNotice('');
    setBusy(provider);
    try {
      const res = await fetch(`/api/account/connections/${provider}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? 'Could not unlink that account.');
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const row = (provider: 'apple' | 'google', label: string) => {
    const linked = conn?.[provider] ?? false;
    return (
      <Group justify="space-between" wrap="nowrap">
        <Text>
          {label}
          {linked ? <Text span c="green" size="sm"> · Connected</Text> : null}
        </Text>
        {linked ? (
          <Button
            variant="subtle"
            color="red"
            size="xs"
            loading={busy === provider}
            onClick={() => unlink(provider)}
          >
            Unlink
          </Button>
        ) : (
          <Button
            variant="light"
            size="xs"
            component="a"
            href={`/api/account/link/${provider}?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Link
          </Button>
        )}
      </Group>
    );
  };

  return (
    <Paper withBorder p="lg" radius="md" mt="lg">
      <Title order={4} mb="md">Connected Accounts</Title>
      <Stack gap="md">
        {error && <Alert color="red">{error}</Alert>}
        {notice && <Alert color="green">{notice}</Alert>}
        {row('apple', 'Apple')}
        {row('google', 'Google')}
        <Text size="xs" c="dimmed">
          Link a provider to sign in with it. You can&apos;t unlink your only sign-in method.
        </Text>
      </Stack>
    </Paper>
  );
}
