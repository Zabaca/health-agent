"use client";

import { useState } from "react";
import {
  Table, Badge, Text, Anchor, Button, Modal, Stack, Group,
  Alert, CopyButton, Tooltip, ActionIcon, Divider,
} from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconCheck, IconCopy, IconShieldCheck, IconKey } from "@tabler/icons-react";

interface Agent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  type: string;
  mustChangePassword: boolean;
  createdAt: string;
}

interface ResetState {
  agent: Agent;
  step: "confirm" | "done";
  newPassword: string | null;
  loading: boolean;
  error: string | null;
}

export default function AgentsTable({ agents }: { agents: Agent[] }) {
  const [reset, setReset] = useState<ResetState | null>(null);
  const router = useRouter();

  function openReset(agent: Agent) {
    setReset({ agent, step: "confirm", newPassword: null, loading: false, error: null });
  }

  function closeReset() {
    if (reset?.step === "done") router.refresh();
    setReset(null);
  }

  async function confirmReset() {
    if (!reset) return;
    setReset((r) => r && { ...r, loading: true, error: null });

    const res = await fetch(`/api/admin/agents/${reset.agent.id}/reset-password`, {
      method: "PUT",
    });
    const data = await res.json();

    if (!res.ok) {
      setReset((r) => r && { ...r, loading: false, error: data.error ?? "Something went wrong" });
      return;
    }

    setReset((r) => r && { ...r, loading: false, step: "done", newPassword: data.plainPassword });
  }

  const agentName = reset
    ? [reset.agent.firstName, reset.agent.lastName].filter(Boolean).join(" ") || reset.agent.email
    : "";

  return (
    <>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {agents.map((agent) => (
            <Table.Tr key={agent.id}>
              <Table.Td>
                <Anchor component={Link} href={`/admin/agents/${agent.id}`} size="sm">
                  {[agent.firstName, agent.lastName].filter(Boolean).join(" ") || "—"}
                </Anchor>
              </Table.Td>
              <Table.Td>{agent.email}</Table.Td>
              <Table.Td>
                <Badge variant="light" color="violet" tt="capitalize">{agent.type}</Badge>
              </Table.Td>
              <Table.Td>
                {agent.mustChangePassword ? (
                  <Badge color="orange" variant="light">Password reset required</Badge>
                ) : (
                  <Badge color="teal" variant="light">Active</Badge>
                )}
              </Table.Td>
              <Table.Td>
                <Text size="sm">{new Date(agent.createdAt).toLocaleDateString()}</Text>
              </Table.Td>
              <Table.Td>
                <Button
                  size="xs"
                  variant="subtle"
                  color="orange"
                  leftSection={<IconKey size={13} />}
                  onClick={() => openReset(agent)}
                >
                  Reset Password
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={!!reset}
        onClose={closeReset}
        title={reset?.step === "done" ? "Password Reset" : "Reset Password"}
        centered
      >
        {reset?.step === "confirm" && (
          <Stack>
            {reset.error && <Alert color="red" variant="light">{reset.error}</Alert>}
            <Text size="sm">
              Reset the password for <strong>{agentName}</strong>? A new temporary password will be
              generated and the agent will be required to change it on next login.
            </Text>
            <Group justify="flex-end" mt="xs">
              <Button variant="subtle" onClick={closeReset}>Cancel</Button>
              <Button color="orange" loading={reset.loading} onClick={confirmReset}>
                Reset Password
              </Button>
            </Group>
          </Stack>
        )}

        {reset?.step === "done" && reset.newPassword && (
          <Stack>
            <Alert color="teal" variant="light" icon={<IconShieldCheck size={16} />}>
              Password reset for <strong>{agentName}</strong>. Share the temporary password below —
              the agent must change it on next login.
            </Alert>

            <Divider />

            <Stack gap="xs">
              <Text size="xs" c="dimmed" fw={500}>New Temporary Password</Text>
              <Group gap="xs" align="center">
                <Text
                  size="sm"
                  ff="monospace"
                  fw={600}
                  style={{
                    flex: 1,
                    background: "var(--mantine-color-default)",
                    border: "1px solid var(--mantine-color-default-border)",
                    borderRadius: "var(--mantine-radius-sm)",
                    padding: "8px 12px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {reset.newPassword}
                </Text>
                <CopyButton value={reset.newPassword} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied!" : "Copy to clipboard"} withArrow>
                      <ActionIcon
                        color={copied ? "teal" : "gray"}
                        variant="subtle"
                        size="lg"
                        onClick={copy}
                        aria-label="Copy password"
                      >
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Stack>

            <Group justify="flex-end" mt="xs">
              <Button onClick={closeReset}>Done</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
