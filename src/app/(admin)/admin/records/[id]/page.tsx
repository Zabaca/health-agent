import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Title, Grid, Stack, Text, Badge, Group, Card, SimpleGrid } from "@mantine/core";
import DocViewer from "@/components/records/DocViewer";
import PatientAssignmentPanel from "@/components/records/PatientAssignmentPanel";

export default async function AdminRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id } = await params;

  const file = await db.query.incomingFiles.findFirst({
    where: eq(incomingFiles.id, id),
    with: { faxLog: true, patient: true, uploadLog: { with: { uploadedBy: true } } },
  });

  if (!file) notFound();

  const patientName = file.patient
    ? [file.patient.firstName, file.patient.lastName].filter(Boolean).join(' ') || file.patient.email
    : null;

  return (
    <Stack gap="lg">
      <Title order={2}>Received File</Title>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Stack gap="md">
          <Card withBorder>
            <Title order={5} mb="sm">Document</Title>
            <DocViewer fileURL={file.fileURL} />
          </Card>

          {file.uploadLog && (
            <Card withBorder>
              <Title order={5} mb="sm">Upload Metadata</Title>
              <Stack gap="xs">
                <Group gap="xs">
                  <Text size="sm" fw={500}>File name:</Text>
                  <Text size="sm">{file.uploadLog.originalName}</Text>
                </Group>
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
                <Group gap="xs">
                  <Text size="sm" fw={500}>Status:</Text>
                  <Badge size="sm" color={file.faxLog.status === 'retrieved' ? 'green' : file.faxLog.status === 'failed' ? 'red' : 'yellow'}>
                    {file.faxLog.status}
                  </Badge>
                </Group>
              </Stack>
            </Card>
          )}
        </Stack>

        <Card withBorder>
          <PatientAssignmentPanel
            fileId={file.id}
            currentPatientId={file.patientId ?? null}
            currentPatientName={patientName}
            role="admin"
            listPath="/admin/records"
          />
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
