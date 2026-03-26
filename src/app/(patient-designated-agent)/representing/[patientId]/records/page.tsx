import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, patientDesignatedAgentDocumentGrants, incomingFiles } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Title, Breadcrumbs, Anchor, Text } from "@mantine/core";
import Link from "next/link";
import MyRecordsTable from "@/components/records/MyRecordsTable";

export const metadata = { title: "Patient Records" };

export default async function RepresentingRecordsPage({
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
    with: {
      patient: true,
      documentGrants: true,
    },
  });

  if (!relation || !relation.documentPermission) notFound();

  let files;
  if (relation.documentScope === 'specific') {
    const grantedIds = relation.documentGrants.map(g => g.incomingFileId);
    files = grantedIds.length > 0
      ? await db.query.incomingFiles.findMany({
          where: inArray(incomingFiles.id, grantedIds),
          with: { faxLog: true, uploadLog: { with: { uploadedBy: true } } },
          orderBy: (f, { desc }) => [desc(f.createdAt)],
        })
      : [];
  } else {
    files = await db.query.incomingFiles.findMany({
      where: eq(incomingFiles.patientId, patientId),
      with: { faxLog: true, uploadLog: { with: { uploadedBy: true } } },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    });
  }

  const patientName =
    [relation.patient?.firstName, relation.patient?.lastName].filter(Boolean).join(' ') ||
    relation.patient?.email ||
    'Patient';

  const rows = files.map(f => ({
    id: f.id,
    createdAt: f.createdAt,
    fileType: f.fileType,
    fileURL: f.fileURL,
    originalName: f.uploadLog?.originalName ?? null,
    releaseCode: f.releaseCode ?? null,
    pagecount: f.faxLog?.pagecount ?? null,
    uploadedBy: f.uploadLog?.uploadedBy
      ? [f.uploadLog.uploadedBy.firstName, f.uploadLog.uploadedBy.lastName].filter(Boolean).join(' ') || f.uploadLog.uploadedBy.email
      : null,
  }));

  return (
    <>
      <Breadcrumbs mb="md">
        <Anchor component={Link} href={`/representing/${patientId}`} size="sm">{patientName}</Anchor>
        <Text size="sm">Records</Text>
      </Breadcrumbs>
      <Title order={2} mb="lg">Records</Title>
      <MyRecordsTable rows={rows} />
    </>
  );
}
