import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, or } from "drizzle-orm";
import {
  Stack, Group, Title, Paper, SimpleGrid, Text, Button, Badge,
} from "@mantine/core";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

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
  const agent = await db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.type, "agent")),
  });
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

  const agent = await db.query.users.findFirst({
    where: and(eq(users.id, id), or(eq(users.type, "agent"), eq(users.type, "admin"))),
  });

  if (!agent) notFound();

  const name = [agent.firstName, agent.middleName, agent.lastName].filter(Boolean).join(" ") || "—";

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Group gap="sm">
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
        </Group>
        {agent.mustChangePassword && (
          <Badge color="orange" variant="light">Password reset required</Badge>
        )}
      </Group>

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

      <Group justify="flex-end">
        <Text size="xs" c="dimmed">
          Created {new Date(agent.createdAt).toLocaleDateString()}
        </Text>
      </Group>
    </Stack>
  );
}
