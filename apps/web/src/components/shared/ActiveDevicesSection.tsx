"use client";

import { useEffect, useState } from "react";
import {
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Button,
  Loader,
  Alert,
} from "@mantine/core";

type SessionRow = {
  id: string;
  platform: "web" | "ios" | "android";
  deviceName: string | null;
  userAgent: string | null;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  expires: string;
  isCurrent: boolean;
};

function formatLocation(row: SessionRow): string {
  if (row.city && row.country) return `${row.city}, ${row.country}`;
  if (row.country) return row.country;
  if (row.ip && row.ip !== "::1" && row.ip !== "127.0.0.1") return row.ip;
  return "Unknown location";
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export default function ActiveDevicesSection() {
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const res = await fetch("/api/me/sessions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load sessions");
      setRows(data.sessions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const revoke = async (id: string) => {
    setRevokingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/me/sessions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to revoke session");
      if (data.revokedSelf) {
        // We just revoked our own session — kick to login on next request.
        window.location.href = "/login";
        return;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Paper p="md" radius="md" withBorder mt="md">
      <Stack>
        <Title order={4}>Active devices</Title>
        <Text c="dimmed" size="sm">
          Devices currently signed in to your account. If you don&apos;t recognize one, sign it out.
        </Text>

        {error && <Alert color="red">{error}</Alert>}

        {rows === null ? (
          <Loader size="sm" />
        ) : rows.length === 0 ? (
          <Text c="dimmed" size="sm">No active sessions.</Text>
        ) : (
          <Stack gap="xs">
            {rows.map((row) => (
              <Paper key={row.id} p="sm" radius="sm" withBorder>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={4}>
                    <Group gap="xs">
                      <Text fw={500}>{row.deviceName ?? "Unknown device"}</Text>
                      <Badge size="xs" variant="light">{row.platform}</Badge>
                      {row.isCurrent && <Badge size="xs" color="green">This device</Badge>}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {formatLocation(row)} · last active {formatRelative(row.lastSeenAt)}
                    </Text>
                  </Stack>
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    loading={revokingId === row.id}
                    onClick={() => revoke(row.id)}
                  >
                    {row.isCurrent ? "Sign out" : "Revoke"}
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
