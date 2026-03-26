"use client";

import { useState } from "react";
import {
  Title,
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
  Divider,
  Alert,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconTrash, IconEdit, IconUser } from "@tabler/icons-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  healthRecordsScope: 'all' | 'specific' | null;
  manageProvidersPermission: 'viewer' | 'editor' | null;
  releasePermission: 'viewer' | 'editor' | null;
  createdAt: string;
  tokenExpiresAt: string | null;
  agentUser: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
}

interface Props {
  assignedAgent: AssignedAgent | null;
  designatedAgents: DesignatedAgent[];
}

const inviteSchema = z.object({
  inviteeEmail: z.string().email("Valid email required"),
  relationship: z.string().optional(),
  healthRecordsPermission: z.enum(['', 'viewer', 'editor']).optional(),
  healthRecordsScope: z.enum(['', 'all', 'specific']).optional(),
  manageProvidersPermission: z.enum(['', 'viewer', 'editor']).optional(),
  releasePermission: z.enum(['', 'viewer', 'editor']).optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

const RELATIONSHIP_SUGGESTIONS = ['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Caregiver', 'Friend', 'Other'];

const statusColor = { pending: 'yellow', accepted: 'green', revoked: 'red' } as const;

function PermissionsForm({ control, watch }: { control: any; watch: any }) {
  const healthRecordsPermission = watch('healthRecordsPermission');
  return (
    <Stack gap="md">
      <Text fw={500} size="sm">Permissions (optional)</Text>

      <Controller
        name="healthRecordsPermission"
        control={control}
        render={({ field }) => (
          <Radio.Group label="Health Records" {...field} value={field.value ?? ''}>
            <Stack gap="xs" mt="xs">
              <Radio value="" label="None" />
              <Radio value="viewer" label="Viewer — read only" />
              <Radio value="editor" label="Editor — view, upload, delete" />
            </Stack>
          </Radio.Group>
        )}
      />
      {(healthRecordsPermission === 'viewer' || healthRecordsPermission === 'editor') && (
        <Controller
          name="healthRecordsScope"
          control={control}
          render={({ field }) => (
            <Radio.Group label="Which documents?" {...field} value={field.value ?? ''}>
              <Stack gap="xs" mt="xs">
                <Radio value="all" label="All documents (including future)" />
                <Radio value="specific" label="Specific documents (configure after invite)" />
              </Stack>
            </Radio.Group>
          )}
        />
      )}

      <Controller
        name="manageProvidersPermission"
        control={control}
        render={({ field }) => (
          <Radio.Group label="Manage Providers" {...field} value={field.value ?? ''}>
            <Stack gap="xs" mt="xs">
              <Radio value="" label="None" />
              <Radio value="viewer" label="Viewer — read only" />
              <Radio value="editor" label="Editor — full access" />
            </Stack>
          </Radio.Group>
        )}
      />

      <Controller
        name="releasePermission"
        control={control}
        render={({ field }) => (
          <Radio.Group label="HIPAA Release Request" {...field} value={field.value ?? ''}>
            <Stack gap="xs" mt="xs">
              <Radio value="" label="None" />
              <Radio value="viewer" label="Viewer — read only" />
              <Radio value="editor" label="Editor — view & manage" />
            </Stack>
          </Radio.Group>
        )}
      />
    </Stack>
  );
}

export default function MyDesignatedAgentsClient({ assignedAgent, designatedAgents: initial }: Props) {
  const [agents, setAgents] = useState(initial);
  const [inviteOpen, { open: openInvite, close: closeInvite }] = useDisclosure();
  const [editTarget, setEditTarget] = useState<DesignatedAgent | null>(null);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { healthRecordsPermission: '', healthRecordsScope: '', manageProvidersPermission: '', releasePermission: '' },
  });

  const editForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
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
          healthRecordsScope: data.healthRecordsScope || null,
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
      inviteForm.reset({ healthRecordsPermission: '', healthRecordsScope: '', manageProvidersPermission: '', releasePermission: '' });
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async (data: InviteFormData) => {
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
          healthRecordsScope: data.healthRecordsScope || null,
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
    } finally {
      setLoading(false);
    }
  };

  const onRevoke = async (id: string) => {
    if (!confirm('Revoke this representative\'s access?')) return;
    await fetch(`/api/my-designated-agents/${id}`, { method: 'DELETE' });
    await reload();
  };

  const openEdit = (agent: DesignatedAgent) => {
    setEditTarget(agent);
    editForm.reset({
      relationship: agent.relationship ?? '',
      healthRecordsPermission: agent.healthRecordsPermission ?? '',
      healthRecordsScope: agent.healthRecordsScope ?? '',
      manageProvidersPermission: agent.manageProvidersPermission ?? '',
      releasePermission: agent.releasePermission ?? '',
    });
  };

  return (
    <Stack>
      {/* Assigned Agent (read-only) */}
      <div>
        <Title order={4} mb="sm">Zabaca Assigned Agent</Title>
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

      {/* Designated Agents */}
      <Group justify="space-between" align="center">
        <Title order={4}>Invites</Title>
        <Button leftSection={<IconPlus size={14} />} size="sm" onClick={openInvite}>
          Invite Representative
        </Button>
      </Group>

      {agents.length === 0 ? (
        <Text c="dimmed" size="sm">No representatives yet. Invite a family member or caregiver.</Text>
      ) : (
        <Stack gap="sm">
          {agents.map(agent => (
            <Card key={agent.id} withBorder padding="md" radius="md">
              <Group justify="space-between" align="flex-start">
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
                    {agent.healthRecordsScope && (
                      <Badge size="xs" variant="outline" color="gray">{agent.healthRecordsScope} docs</Badge>
                    )}
                    {agent.manageProvidersPermission && (
                      <Badge size="xs" variant="outline" color="teal">providers: {agent.manageProvidersPermission}</Badge>
                    )}
                    {agent.releasePermission && (
                      <Badge size="xs" variant="outline" color="violet">releases: {agent.releasePermission}</Badge>
                    )}
                  </Group>
                </div>
                {agent.status !== 'revoked' && (
                  <Group gap="xs">
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
      <Modal opened={inviteOpen} onClose={closeInvite} title="Invite Representative" size="md">
        <form onSubmit={inviteForm.handleSubmit(onInvite)}>
          <Stack>
            {serverError && <Alert color="red">{serverError}</Alert>}
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
            <PermissionsForm control={inviteForm.control} watch={inviteForm.watch} />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={closeInvite}>Cancel</Button>
              <Button type="submit" loading={loading}>Send Invite</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal opened={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Permissions" size="md">
        <form onSubmit={editForm.handleSubmit(onEdit)}>
          <Stack>
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
            <PermissionsForm control={editForm.control} watch={editForm.watch} />
            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" loading={loading}>Save</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
