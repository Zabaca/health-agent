"use client";

import { useState } from "react";
import {
  Text,
  Stack,
  Card,
  Group,
  Badge,
  Button,
  ActionIcon,
  Modal,
  TextInput,
  Autocomplete,
  Radio,
  SimpleGrid,
  Divider,
  Alert,
  Avatar,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash, IconEdit, IconUser, IconInfoCircle, IconSend } from "@tabler/icons-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageHeader from "@/components/shared/PageHeader";

interface AssignedAgent {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface DesignatedAgent {
  id: string;
  inviteeEmail: string;
  relationship: string | null;
  status: 'pending' | 'accepted' | 'revoked';
  healthRecordsPermission: 'viewer' | 'editor' | null;
  manageProvidersPermission: 'viewer' | 'editor' | null;
  releasePermission: 'viewer' | 'editor' | null;
  createdAt: string;
  tokenExpiresAt: string | null;
  agentUser: { id: string; email: string; firstName: string | null; lastName: string | null; avatarUrl: string | null } | null;
}

interface Props {
  assignedAgent: AssignedAgent | null;
  designatedAgents: DesignatedAgent[];
  redirectTo?: string;
}

const permissionsFields = {
  relationship: z.string().optional(),
  healthRecordsPermission: z.enum(['', 'viewer', 'editor']).optional(),
  manageProvidersPermission: z.enum(['', 'viewer', 'editor']).optional(),
  releasePermission: z.enum(['', 'viewer', 'editor']).optional(),
};

const inviteSchema = z.object({
  inviteeEmail: z.string().email("Valid email required"),
  ...permissionsFields,
});

const editSchema = z.object(permissionsFields);

type InviteFormData = z.infer<typeof inviteSchema>;
type EditFormData = z.infer<typeof editSchema>;

const RELATIONSHIP_SUGGESTIONS = ['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Caregiver', 'Friend', 'Other'];

const statusColor = { pending: 'yellow', accepted: 'green', revoked: 'red' } as const;

const permissionTooltips = {
  healthRecords: (
    <Stack gap={4}>
      <Text size="xs"><Text span fw={600}>None</Text> – No access</Text>
      <Text size="xs"><Text span fw={600}>Viewer</Text> – Read only access to all documents.</Text>
      <Text size="xs"><Text span fw={600}>Editor</Text> – Upload new documents. View, edit, and delete all documents.</Text>
    </Stack>
  ),
  manageProviders: (
    <Stack gap={4}>
      <Text size="xs"><Text span fw={600}>None</Text> – No access</Text>
      <Text size="xs"><Text span fw={600}>Viewer</Text> – View health providers and their contact information.</Text>
      <Text size="xs"><Text span fw={600}>Editor</Text> – Add, edit health providers information, delete health provider entries.</Text>
    </Stack>
  ),
  hipaaRelease: (
    <Stack gap={4}>
      <Text size="xs"><Text span fw={600}>None</Text> – No access</Text>
      <Text size="xs"><Text span fw={600}>Viewer</Text> – See HIPAA Release requests where this individual is designated as an authorized representative.</Text>
      <Text size="xs"><Text span fw={600}>Editor</Text> – Create HIPAA Release request indicating that this individual is the authorized representative. Patient signature is still required to finalize form.</Text>
    </Stack>
  ),
};

function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: React.ReactNode }) {
  return (
    <Group gap={4} align="center">
      <span>{label}</span>
      <Tooltip label={tooltip} multiline w={260} withArrow>
        <IconInfoCircle size={14} style={{ cursor: 'help', color: 'var(--mantine-color-dimmed)' }} />
      </Tooltip>
    </Group>
  );
}

function PermissionsForm({ control }: { control: any }) {
  return (
    <Stack gap="xs">
      <Text fw={500} size="sm">Permissions (optional)</Text>
      <SimpleGrid cols={3} spacing="sm">
        <Controller
          name="healthRecordsPermission"
          control={control}
          render={({ field }) => (
            <Radio.Group label={<LabelWithTooltip label="Health Records" tooltip={permissionTooltips.healthRecords} />} {...field} value={field.value ?? ''}>
              <Stack gap={4} mt={4}>
                <Radio value="" label="None" size="xs" />
                <Radio value="viewer" label="Viewer" size="xs" />
                <Radio value="editor" label="Editor" size="xs" />
              </Stack>
            </Radio.Group>
          )}
        />
        <Controller
          name="manageProvidersPermission"
          control={control}
          render={({ field }) => (
            <Radio.Group label={<LabelWithTooltip label="Manage Providers" tooltip={permissionTooltips.manageProviders} />} {...field} value={field.value ?? ''}>
              <Stack gap={4} mt={4}>
                <Radio value="" label="None" size="xs" />
                <Radio value="viewer" label="Viewer" size="xs" />
                <Radio value="editor" label="Editor" size="xs" />
              </Stack>
            </Radio.Group>
          )}
        />
        <Controller
          name="releasePermission"
          control={control}
          render={({ field }) => (
            <Radio.Group label={<LabelWithTooltip label="HIPAA Release Request" tooltip={permissionTooltips.hipaaRelease} />} {...field} value={field.value ?? ''}>
              <Stack gap={4} mt={4}>
                <Radio value="" label="None" size="xs" />
                <Radio value="viewer" label="Viewer" size="xs" />
                <Radio value="editor" label="Editor" size="xs" />
              </Stack>
            </Radio.Group>
          )}
        />
      </SimpleGrid>
    </Stack>
  );
}

export default function MyDesignatedAgentsClient({ assignedAgent, designatedAgents: initial, redirectTo }: Props) {
  const [agents, setAgents] = useState(initial);
  const [inviteOpen, { open: openInvite, close: closeInvite }] = useDisclosure();
  const [editTarget, setEditTarget] = useState<DesignatedAgent | null>(null);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { healthRecordsPermission: '', manageProvidersPermission: '', releasePermission: '' },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const reload = async () => {
    const res = await fetch('/api/my-designated-agents');
    if (res.ok) {
      const data = await res.json();
      setAgents(data.designatedAgents);
    }
  };

  const onInvite = async (data: InviteFormData) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch('/api/my-designated-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteeEmail: data.inviteeEmail,
          relationship: data.relationship || undefined,
          healthRecordsPermission: data.healthRecordsPermission || null,
          manageProvidersPermission: data.manageProvidersPermission || null,
          releasePermission: data.releasePermission || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setServerError(d.error ?? 'Failed to send invite');
        return;
      }
      await reload();
      closeInvite();
      inviteForm.reset({ healthRecordsPermission: '', manageProvidersPermission: '', releasePermission: '' });
      if (redirectTo) window.location.href = redirectTo;
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async (data: EditFormData) => {
    if (!editTarget) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`/api/my-designated-agents/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship: data.relationship || null,
          healthRecordsPermission: data.healthRecordsPermission || null,
          manageProvidersPermission: data.manageProvidersPermission || null,
          releasePermission: data.releasePermission || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setServerError(d.error ?? 'Failed to update');
        return;
      }
      await reload();
      setEditTarget(null);
      notifications.show({ title: "Saved", message: "Permissions updated successfully.", color: "green" });
    } finally {
      setLoading(false);
    }
  };

  const onRevoke = async (id: string) => {
    if (!confirm('Revoke this representative\'s access?')) return;
    await fetch(`/api/my-designated-agents/${id}`, { method: 'DELETE' });
    await reload();
  };

  const onResend = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/my-designated-agents/${id}/resend`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        notifications.show({ title: 'Error', message: d.error ?? 'Failed to resend invite', color: 'red' });
        return;
      }
      await reload();
      notifications.show({ title: 'Invite sent', message: 'A new invite link has been sent.', color: 'green' });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (agent: DesignatedAgent) => {
    setEditTarget(agent);
    editForm.reset({
      relationship: agent.relationship ?? '',
      healthRecordsPermission: agent.healthRecordsPermission ?? '',
      manageProvidersPermission: agent.manageProvidersPermission ?? '',
      releasePermission: agent.releasePermission ?? '',
    });
  };

  return (
    <Stack>
      <PageHeader
        title="My Designated Agents"
        action={<Button leftSection={<IconPlus size={14} />} onClick={openInvite}>Invite Representative</Button>}
      />

      {/* Assigned Agent (read-only) */}
      <div>
        {assignedAgent ? (
          <Card withBorder padding="md" radius="md">
            <Group>
              <IconUser size={20} />
              <div>
                <Text fw={500}>
                  {[assignedAgent.firstName, assignedAgent.lastName].filter(Boolean).join(' ') || assignedAgent.email}
                </Text>
                <Text size="sm" c="dimmed">{assignedAgent.email}</Text>
              </div>
              <Badge ml="auto" color="blue" variant="light">Assigned by Zabaca</Badge>
            </Group>
          </Card>
        ) : (
          <Text c="dimmed" size="sm">No agent assigned yet.</Text>
        )}
      </div>

      <Divider />

      {agents.length === 0 ? (
        <Text c="dimmed" size="sm">No representatives yet. Invite a family member or caregiver.</Text>
      ) : (
        <Stack gap="sm">
          {agents.map(agent => (
            <Card key={agent.id} withBorder padding="md" radius="md">
              <Group justify="space-between" align="flex-start">
                <Group gap="sm" align="flex-start" style={{ flex: 1 }}>
                  {agent.agentUser ? (
                    <Avatar
                      src={agent.agentUser.avatarUrl || undefined}
                      size={40}
                      radius="50%"
                    >
                      {[agent.agentUser.firstName?.[0], agent.agentUser.lastName?.[0]].filter(Boolean).join('').toUpperCase() || undefined}
                    </Avatar>
                  ) : (
                    <Avatar size={40} radius="50%"><IconUser size={18} /></Avatar>
                  )}
                  <div style={{ flex: 1 }}>
                  <Group gap="xs" mb={4}>
                    <Text fw={500}>
                      {agent.agentUser
                        ? [agent.agentUser.firstName, agent.agentUser.lastName].filter(Boolean).join(' ') || agent.agentUser.email
                        : agent.inviteeEmail}
                    </Text>
                    <Badge size="xs" color={statusColor[agent.status]} variant="light">{agent.status}</Badge>
                  </Group>
                  <Text size="sm" c="dimmed">{agent.inviteeEmail}</Text>
                  {agent.relationship && <Text size="sm" c="dimmed">{agent.relationship}</Text>}
                  <Text size="xs" c="dimmed" mt={4}>
                    Invited: {new Date(agent.createdAt).toLocaleDateString()}
                    {agent.status === 'pending' && agent.tokenExpiresAt && (() => {
                      const msLeft = new Date(agent.tokenExpiresAt).getTime() - Date.now();
                      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
                      return daysLeft > 0
                        ? <> &middot; Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</>
                        : <> &middot; <span style={{ color: 'var(--mantine-color-red-6)' }}>Expired</span></>;
                    })()}
                  </Text>
                  <Group gap="xs" mt="xs">
                    {agent.healthRecordsPermission && (
                      <Badge size="xs" variant="outline">records: {agent.healthRecordsPermission}</Badge>
                    )}
                    {agent.manageProvidersPermission && (
                      <Badge size="xs" variant="outline" color="teal">providers: {agent.manageProvidersPermission}</Badge>
                    )}
                    {agent.releasePermission && (
                      <Badge size="xs" variant="outline" color="violet">releases: {agent.releasePermission}</Badge>
                    )}
                  </Group>
                  </div>
                </Group>
                {agent.status !== 'revoked' && (
                  <Group gap="xs">
                    {agent.status === 'pending' && agent.tokenExpiresAt && new Date(agent.tokenExpiresAt) < new Date() && (
                      <ActionIcon variant="subtle" color="orange" loading={loading} onClick={() => onResend(agent.id)} title="Resend invite">
                        <IconSend size={16} />
                      </ActionIcon>
                    )}
                    <ActionIcon variant="subtle" onClick={() => openEdit(agent)} title="Edit permissions">
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => onRevoke(agent.id)} title="Revoke access">
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                )}
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      {/* Invite Modal */}
      <Modal opened={inviteOpen} onClose={closeInvite} title="Invite Representative" size="lg">
        <form onSubmit={inviteForm.handleSubmit(onInvite)}>
          <Stack gap="sm">
            {serverError && <Alert color="red">{serverError}</Alert>}
            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                label="Email"
                placeholder="representative@example.com"
                required
                error={inviteForm.formState.errors.inviteeEmail?.message}
                {...inviteForm.register("inviteeEmail")}
              />
              <Controller
                name="relationship"
                control={inviteForm.control}
                render={({ field }) => (
                  <Autocomplete
                    label="Relationship"
                    placeholder="e.g. Spouse, Child, Caregiver..."
                    data={RELATIONSHIP_SUGGESTIONS}
                    value={field.value ?? ''}
                    onChange={val => field.onChange(val)}
                  />
                )}
              />
            </SimpleGrid>
            <PermissionsForm control={inviteForm.control} />
            <Group justify="flex-end" mt="xs">
              <Button variant="default" onClick={closeInvite}>Cancel</Button>
              <Button type="submit" loading={loading}>Send Invite</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal opened={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Permissions" size="lg">
        <form onSubmit={editForm.handleSubmit(onEdit)}>
          <Stack gap="sm">
            {serverError && <Alert color="red">{serverError}</Alert>}
            <Controller
              name="relationship"
              control={editForm.control}
              render={({ field }) => (
                <Autocomplete
                  label="Relationship"
                  placeholder="e.g. Spouse, Child, Caregiver..."
                  data={RELATIONSHIP_SUGGESTIONS}
                  value={field.value ?? ''}
                  onChange={val => field.onChange(val)}
                />
              )}
            />
            <PermissionsForm control={editForm.control} />
            <Group justify="flex-end" mt="xs">
              <Button variant="default" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" loading={loading}>Save</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
