"use client";

import { useState } from "react";
import {
  Title, TextInput, Button, Group, Stack, Paper, Text, Badge, Anchor,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";

export default function AdminReleaseLookupPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    releaseCode: string | null;
    firstName: string;
    lastName: string;
    createdAt: string;
    voided: boolean;
    authSignatureImage: string | null;
    patientId: string;
  } | null>(null);

  const handleLookup = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setSearched(false);
    try {
      const res = await apiClient.admin.releaseLookup({ params: { code: trimmed } });
      if (res.status === 200) {
        setResult(res.body);
      } else {
        setResult(null);
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <Stack gap="lg">
      <Title order={2}>Lookup Release</Title>
      <Group align="flex-end">
        <TextInput
          label="Release Code"
          placeholder="e.g. LMQ3X8K2"
          value={code}
          onChange={(e) => setCode(e.currentTarget.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          style={{ flex: 1, maxWidth: 300 }}
        />
        <Button leftSection={<IconSearch size={16} />} loading={loading} onClick={handleLookup}>
          Look Up
        </Button>
      </Group>

      {searched && (
        result ? (
          <Paper withBorder p="md" radius="md" maw={500}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={600}>{result.firstName} {result.lastName}</Text>
                {result.voided ? (
                  <Badge color="orange" variant="light">Voided</Badge>
                ) : result.authSignatureImage ? (
                  <Badge color="green" variant="light">Signed</Badge>
                ) : (
                  <Badge color="yellow" variant="light">Signature Required</Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed">
                Code: <Text span fw={500} c="dark">{result.releaseCode}</Text>
              </Text>
              <Text size="sm" c="dimmed">
                Created: {new Date(result.createdAt).toLocaleDateString()}
              </Text>
              <Anchor
                component={Link}
                href={`/admin/patients/${result.patientId}/releases/${result.id}`}
                size="sm"
              >
                View Release →
              </Anchor>
            </Stack>
          </Paper>
        ) : (
          <Text c="dimmed">No release found for code &ldquo;{code}&rdquo;.</Text>
        )
      )}
    </Stack>
  );
}
