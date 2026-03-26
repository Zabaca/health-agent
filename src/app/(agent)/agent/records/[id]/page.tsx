import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles, patientAssignments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { Title, Stack, Text, Group, Card, Anchor, Breadcrumbs } from "@mantine/core";
import Link from "next/link";
import InlineDocViewer from "@/components/records/InlineDocViewer";

export default async function AgentRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) notFound();

  const file = await db.query.incomingFiles.findFirst({
    where: eq(incomingFiles.id, id),
    with: { faxLog: true, patient: true, uploadLog: { with: { uploadedBy: true } } },
  });

  if (!file) notFound();

  // Allow unassigned files OR files assigned to one of this agent's patients
  if (file.patientId) {
    const assignment = await db.query.patientAssignments.findFirst({
      where: and(
        eq(patientAssignments.patientId, file.patientId),
        eq(patientAssignments.assignedToId, session.user.id)
      ),
    });
    if (!assignment) notFound();
  }

  const fileName = file.uploadLog?.originalName ?? null;
  const patientName = file.patient
    ? [file.patient.firstName, file.patient.lastName].filter(Boolean).join(' ') || file.patient.email
    : null;

  return (
    <Stack gap="lg">
      {file.patientId && (
        <Breadcrumbs>
          <Anchor component={Link} href={`/agent/patients/${file.patientId}?tab=records`} size="sm">
            {patientName ?? 'Patient'}
          </Anchor>
          <Text size="sm">{fileName ?? 'Record'}</Text>
        </Breadcrumbs>
      )}

      <Title order={2}>{fileName ?? 'Record'}</Title>

      <Card withBorder p="md">
        <InlineDocViewer fileURL={file.fileURL} />
      </Card>

      {file.uploadLog && (
        <Card withBorder>
          <Title order={5} mb="sm">Upload Details</Title>
          <Stack gap="xs">
            <Group gap="xs">
              <Text size="sm" fw={500}>Uploaded by:</Text>
              <Text size="sm">
                {file.uploadLog.uploadedBy
                  ? [file.uploadLog.uploadedBy.firstName, file.uploadLog.uploadedBy.lastName].filter(Boolean).join(' ') || file.uploadLog.uploadedBy.email
                  : '—'}
              </Text>
            </Group>
            <Group gap="xs">
              <Text size="sm" fw={500}>Uploaded at:</Text>
              <Text size="sm">{new Date(file.uploadLog.uploadedAt).toLocaleString()}</Text>
            </Group>
          </Stack>
        </Card>
      )}

      {file.faxLog && (
        <Card withBorder>
          <Title order={5} mb="sm">Fax Details</Title>
          <Stack gap="xs">
            <Group gap="xs">
              <Text size="sm" fw={500}>Received:</Text>
              <Text size="sm">{file.faxLog.recvdate} {file.faxLog.starttime}</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm" fw={500}>Pages:</Text>
              <Text size="sm">{file.faxLog.pagecount ?? '—'}</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm" fw={500}>Caller ID:</Text>
              <Text size="sm">{file.faxLog.cid ?? '—'}</Text>
            </Group>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
