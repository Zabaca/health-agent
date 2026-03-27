import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Stack, Text, Group, Card, Anchor, Breadcrumbs } from "@mantine/core";
import Link from "next/link";
import InlineDocViewer from "@/components/records/InlineDocViewer";

export default async function MyRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const file = await db.query.incomingFiles.findFirst({
    where: eq(incomingFiles.id, id),
    with: { faxLog: true, uploadLog: true },
  });

  if (!file || file.patientId !== session?.user?.id) notFound();

  const fileName = file.uploadLog?.originalName ?? null;

  return (
    <Stack gap="lg">
      <Breadcrumbs>
        <Anchor component={Link} href="/my-records">My Records</Anchor>
        <Text>{fileName ?? 'Record'}</Text>
      </Breadcrumbs>

      <Card withBorder p="md">
        <InlineDocViewer fileURL={file.fileURL} />
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
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
