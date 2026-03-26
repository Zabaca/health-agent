import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, releases, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Title, Breadcrumbs, Anchor, Text, Button, Group, Table, Badge } from "@mantine/core";
import Link from "next/link";
import { IconEye } from "@tabler/icons-react";

export const metadata = { title: "HIPAA Releases" };

export default async function RepresentingReleasesPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { patientId } = await params;

  const [relation, pda] = await Promise.all([
    db.query.patientDesignatedAgents.findFirst({
      where: and(
        eq(patientDesignatedAgents.agentUserId, session.user.id),
        eq(patientDesignatedAgents.patientId, patientId),
        eq(patientDesignatedAgents.status, 'accepted'),
      ),
      with: { patient: true },
    }),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { email: true },
    }),
  ]);

  if (!relation || !relation.releasePermission) notFound();

  const pdaEmail = pda?.email ?? '';

  const allReleases = await db.query.releases.findMany({
    where: and(
      eq(releases.userId, patientId),
      eq(releases.releaseAuthAgent, true),
    ),
    with: { providers: { columns: { providerName: true }, orderBy: (p, { asc }) => [asc(p.order)] } },
    orderBy: [desc(releases.updatedAt)],
  });

  const myReleases = allReleases.filter(r => r.authAgentEmail === pdaEmail);

  const patientName =
    [relation.patient?.firstName, relation.patient?.lastName].filter(Boolean).join(' ') ||
    relation.patient?.email || 'Patient';

  return (
    <>
      <Breadcrumbs mb="md">
        <Anchor component={Link} href={`/representing/${patientId}`} size="sm">{patientName}</Anchor>
        <Text size="sm">HIPAA Releases</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>HIPAA Release Requests</Title>
        {relation.releasePermission === 'editor' && (
          <Button component={Link} href={`/representing/${patientId}/releases/new`}>
            New Release
          </Button>
        )}
      </Group>

      {myReleases.length === 0 ? (
        <Text c="dimmed">No releases yet.{relation.releasePermission === 'editor' && ' Create one to get started.'}</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Patient</Table.Th>
              <Table.Th>Providers</Table.Th>
              <Table.Th>Release Code</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {myReleases.map(r => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.firstName} {r.lastName}</Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {r.providers.length > 0 ? r.providers.map(p => p.providerName).join(', ') : '—'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {r.releaseCode ? <Text size="sm" ff="monospace">{r.releaseCode}</Text> : <Text size="sm" c="dimmed">—</Text>}
                </Table.Td>
                <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  {r.voided ? (
                    <Badge color="red" variant="light">Voided</Badge>
                  ) : !r.authSignatureImage ? (
                    <Badge color="yellow" variant="light">Awaiting Patient Signature</Badge>
                  ) : (
                    <Badge color="green" variant="light">Signed</Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Anchor component={Link} href={`/representing/${patientId}/releases/${r.id}`} size="sm">
                    <IconEye size={16} />
                  </Anchor>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </>
  );
}
