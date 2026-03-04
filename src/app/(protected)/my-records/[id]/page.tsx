import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Title, Stack, Text, Badge, Group, Card } from "@mantine/core";
import TiffViewer from "@/components/records/TiffViewer";

export default async function MyRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const file = await db.query.incomingFiles.findFirst({
    where: eq(incomingFiles.id, id),
    with: { faxLog: true },
  });

  // 404 if not found or not assigned to this patient
  if (!file || file.patientId !== session?.user?.id) notFound();

  return (
    <Stack gap="lg">
      <Title order={2}>My Record</Title>

      <Card withBorder>
        <Title order={5} mb="sm">Document</Title>
        <TiffViewer filePath={file.filePath} />
      </Card>

      {file.faxLog && (
        <Card withBorder>
          <Title order={5} mb="sm">Details</Title>
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
              <Text size="sm" fw={500}>Type:</Text>
              <Badge size="sm" variant="light">{file.fileType.toUpperCase()}</Badge>
            </Group>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
