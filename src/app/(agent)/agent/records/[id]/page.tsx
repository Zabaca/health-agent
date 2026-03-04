import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Title, Stack, Text, Badge, Group, Card, SimpleGrid } from "@mantine/core";
import TiffViewer from "@/components/records/TiffViewer";
import PatientAssignmentPanel from "@/components/records/PatientAssignmentPanel";

export default async function AgentRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id } = await params;

  const file = await db.query.incomingFiles.findFirst({
    where: eq(incomingFiles.id, id),
    with: { faxLog: true, patient: true },
  });

  if (!file) notFound();

  // Agents can only see unassigned files
  if (file.patientId) notFound();

  return (
    <Stack gap="lg">
      <Title order={2}>Received File</Title>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Stack gap="md">
          <Card withBorder>
            <Title order={5} mb="sm">Document</Title>
            <TiffViewer filePath={file.filePath} />
          </Card>

          {file.faxLog && (
            <Card withBorder>
              <Title order={5} mb="sm">Fax Metadata</Title>
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
                <Group gap="xs">
                  <Text size="sm" fw={500}>DNIS:</Text>
                  <Text size="sm">{file.faxLog.dnis ?? '—'}</Text>
                </Group>
                <Group gap="xs">
                  <Text size="sm" fw={500}>TSID:</Text>
                  <Text size="sm">{file.faxLog.tsid ?? '—'}</Text>
                </Group>
              </Stack>
            </Card>
          )}
        </Stack>

        <Card withBorder>
          <PatientAssignmentPanel
            fileId={file.id}
            currentPatientId={null}
            currentPatientName={null}
            role="agent"
            listPath="/agent/records"
          />
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
