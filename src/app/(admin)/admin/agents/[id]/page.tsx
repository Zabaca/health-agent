import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  Stack, Group, Title, Paper, SimpleGrid, Text, Button, Badge, Divider,
} from "@mantine/core";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import DisableUserButton from "@/components/admin/DisableUserButton";
import AssignedPatientsTable from "@/components/admin/AssignedPatientsTable";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={500}>{label}</Text>
      <Text size="sm">{value || "—"}</Text>
    </Stack>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await db.query.users.findFirst({ where: eq(users.id, id) });
  const name = [agent?.firstName, agent?.lastName].filter(Boolean).join(" ") || "Agent";
  return { title: `${name} — Admin Portal` };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id } = await params;

  const agent = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!agent) notFound();

  const name = [agent.firstName, agent.middleName, agent.lastName].filter(Boolean).join(" ") || "—";
  const displayName = [agent.firstName, agent.lastName].filter(Boolean).join(" ") || agent.email;

  const assignedPatients = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(patientAssignments)
    .innerJoin(users, eq(users.id, patientAssignments.patientId))
    .where(eq(patientAssignments.assignedToId, id));

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Group gap="sm" align="center">
          <Button
            component={Link}
            href="/admin/agents"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            px={0}
          >
            Agents
          </Button>
          <Title order={2}>{name}</Title>
          {!!agent.disabled && (
            <Badge color="red" variant="light">Account Suspended</Badge>
          )}
        </Group>
        {agent.mustChangePassword && !agent.disabled && (
          <Badge color="orange" variant="light">Password reset required</Badge>
        )}
      </Group>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="md">Account Actions</Title>
        <Divider mb="md" />
        <DisableUserButton
          userId={agent.id}
          userName={displayName}
          disabled={!!agent.disabled}
        />
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="md">Profile</Title>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Field label="First Name" value={agent.firstName} />
            <Field label="Middle Name" value={agent.middleName} />
            <Field label="Last Name" value={agent.lastName} />
          </SimpleGrid>
          <Field label="Email" value={agent.email} />
          <Field label="Address" value={agent.address} />
          <Field label="Phone Number" value={agent.phoneNumber} />
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="md">Assigned Patients</Title>
        {assignedPatients.length === 0 ? (
          <Text size="sm" c="dimmed">No patients assigned.</Text>
        ) : (
          <AssignedPatientsTable
            patients={assignedPatients}
            basePath="/admin/patients"
          />
        )}
      </Paper>

      <Group justify="flex-end">
        <Text size="xs" c="dimmed">
          Created {new Date(agent.createdAt).toLocaleDateString()}
        </Text>
      </Group>
    </Stack>
  );
}
