"use client";

import { useState } from "react";
import {
  Table, Badge, Text, Anchor, Button, Modal, Stack, Group,
  Alert, CopyButton, Tooltip, ActionIcon, Divider, Title, TextInput,
} from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconCheck, IconCopy, IconShieldCheck, IconKey, IconRefresh, IconMail, IconTrash } from "@tabler/icons-react";

interface Agent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  type: string;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface PendingInvite {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "agent";
  status: "pending" | "accepted" | "canceled";
  tokenExpiresAt: string;
  createdAt: string;
}

interface ResetState {
  agent: Agent;
  step: "confirm" | "done";
  newPassword: string | null;
  loading: boolean;
  error: string | null;
}

interface ChangeEmailState {
  invite: PendingInvite;
  newEmail: string;
  loading: boolean;
  error: string | null;
}

export default function AgentsTable({
  agents,
  pendingInvites = [],
}: {
  agents: Agent[];
  pendingInvites?: PendingInvite[];
}) {
  const [reset, setReset] = useState<ResetState | null>(null);
  const [changeEmail, setChangeEmail] = useState<ChangeEmailState | null>(null);
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  const router = useRouter();

  // ── Password reset ────────────────────────────────────────────────────────

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

    const res = await fetch(`/api/admin/agents/${reset.agent.id}/reset-password`, { method: "PUT" });
    const data = await res.json();

    if (!res.ok) {
      setReset((r) => r && { ...r, loading: false, error: data.error ?? "Something went wrong" });
      return;
    }

    setReset((r) => r && { ...r, loading: false, step: "done", newPassword: data.plainPassword });
  }

  // ── Invite actions ────────────────────────────────────────────────────────

  async function handleResend(invite: PendingInvite) {
    setInviteLoading(invite.id);
    const res = await fetch(`/api/admin/staff-invites/${invite.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend" }),
    });
    setInviteLoading(null);
    if (res.ok) router.refresh();
  }

  async function handleCancel(invite: PendingInvite) {
    setInviteLoading(invite.id);
    const res = await fetch(`/api/admin/staff-invites/${invite.id}`, { method: "DELETE" });
    setInviteLoading(null);
    if (res.ok) router.refresh();
  }

  async function handleChangeEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changeEmail) return;
    setChangeEmail((s) => s && { ...s, loading: true, error: null });

    const res = await fetch(`/api/admin/staff-invites/${changeEmail.invite.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-email", newEmail: changeEmail.newEmail }),
    });
    const data = await res.json();

    if (!res.ok) {
      setChangeEmail((s) => s && { ...s, loading: false, error: data.error ?? "Something went wrong" });
      return;
    }

    setChangeEmail(null);
    router.refresh();
  }

  const agentName = reset
    ? [reset.agent.firstName, reset.agent.lastName].filter(Boolean).join(" ") || reset.agent.email
    : "";

  const activePendingInvites = pendingInvites.filter((i) => i.status === "pending");

  return (
    <>
      {/* ── Active staff ── */}
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
                <Badge variant="light" color={agent.type === "admin" ? "teal" : "violet"} tt="capitalize">{agent.type}</Badge>
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

      {/* ── Pending invites ── */}
      {activePendingInvites.length > 0 && (
        <>
          <Title order={4} mt="xl" mb="sm">Pending Invites</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Sent</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {activePendingInvites.map((invite) => {
                const isExpired = new Date(invite.tokenExpiresAt) < new Date();
                const isActing = inviteLoading === invite.id;
                return (
                  <Table.Tr key={invite.id}>
                    <Table.Td>
                      <Text size="sm">{invite.firstName} {invite.lastName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{invite.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={invite.role === "admin" ? "teal" : "violet"} tt="capitalize">
                        {invite.role}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {isExpired ? (
                        <Badge color="red" variant="light">Expired</Badge>
                      ) : (
                        <Badge color="blue" variant="light">Pending</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(invite.createdAt).toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Resend invite" withArrow>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="blue"
                            loading={isActing}
                            onClick={() => handleResend(invite)}
                            aria-label="Resend invite"
                          >
                            <IconRefresh size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Change email" withArrow>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            disabled={isActing}
                            onClick={() => setChangeEmail({ invite, newEmail: invite.email, loading: false, error: null })}
                            aria-label="Change email"
                          >
                            <IconMail size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Cancel invite" withArrow>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            loading={isActing}
                            onClick={() => handleCancel(invite)}
                            aria-label="Cancel invite"
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </>
      )}

      {/* ── Reset password modal ── */}
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

      {/* ── Change email modal ── */}
      <Modal
        opened={!!changeEmail}
        onClose={() => setChangeEmail(null)}
        title="Change Invite Email"
        centered
      >
        {changeEmail && (
          <form onSubmit={handleChangeEmailSubmit}>
            <Stack>
              {changeEmail.error && <Alert color="red" variant="light">{changeEmail.error}</Alert>}
              <Text size="sm">
                Update the email address for <strong>{changeEmail.invite.firstName} {changeEmail.invite.lastName}</strong>.
                A new invite will be sent to the updated address.
              </Text>
              <TextInput
                label="New Email"
                type="email"
                required
                value={changeEmail.newEmail}
                onChange={(e) => setChangeEmail((s) => s && { ...s, newEmail: e.target.value })}
              />
              <Group justify="flex-end" mt="xs">
                <Button variant="subtle" onClick={() => setChangeEmail(null)}>Cancel</Button>
                <Button type="submit" loading={changeEmail.loading}>Update & Resend</Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>
    </>
  );
}
