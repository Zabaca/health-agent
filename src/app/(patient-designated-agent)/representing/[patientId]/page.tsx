import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Title, Text, Stack, Card, Group, Badge, SimpleGrid } from "@mantine/core";
import Link from "next/link";
import { IconFolder, IconBuildingHospital } from "@tabler/icons-react";

export const metadata = { title: "Representing Patient" };

export default async function RepresentingPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { patientId } = await params;

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, session.user.id),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
    with: { patient: true },
  });

  if (!relation) notFound();

  const patientName =
    [relation.patient?.firstName, relation.patient?.lastName].filter(Boolean).join(' ') ||
    relation.patient?.email ||
    'Patient';

  return (
    <Stack>
      <div>
        <Title order={2}>{patientName}</Title>
        {relation.relationship && (
          <Text c="dimmed" size="sm">{relation.relationship}</Text>
        )}
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mt="md">
        {relation.documentPermission && (
          <Card component={Link} href={`/representing/${patientId}/records`} withBorder padding="lg" radius="md" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Group>
              <IconFolder size={32} stroke={1.5} />
              <div>
                <Text fw={600}>Records</Text>
                <Text size="sm" c="dimmed">
                  {relation.documentPermission === 'editor' ? 'View & edit documents' : 'View documents'}
                </Text>
              </div>
            </Group>
            <Badge mt="sm" size="xs" variant="light" color={relation.documentPermission === 'editor' ? 'blue' : 'gray'}>
              {relation.documentPermission}
            </Badge>
          </Card>
        )}

        {relation.canManageProviders && (
          <Card component={Link} href={`/representing/${patientId}/providers`} withBorder padding="lg" radius="md" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Group>
              <IconBuildingHospital size={32} stroke={1.5} />
              <div>
                <Text fw={600}>Providers</Text>
                <Text size="sm" c="dimmed">Manage provider information</Text>
              </div>
            </Group>
          </Card>
        )}
      </SimpleGrid>

      {!relation.documentPermission && !relation.canManageProviders && (
        <Text c="dimmed" mt="md">
          You have not been granted any permissions yet. Ask {patientName} to update your access.
        </Text>
      )}
    </Stack>
  );
}
