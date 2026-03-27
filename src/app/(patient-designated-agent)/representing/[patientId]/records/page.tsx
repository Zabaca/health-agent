import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, incomingFiles, releases, users } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Title, Breadcrumbs, Anchor, Text, Group } from "@mantine/core";
import Link from "next/link";
import MyRecordsTable from "@/components/records/MyRecordsTable";
import UploadFileButton from "@/components/records/UploadFileButton";

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

  if (!relation || !relation.healthRecordsPermission) notFound();

  let files;
  if (relation.healthRecordsScope === 'specific') {
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

  // Fetch releases where this PDA is the authorized agent
  const pdaUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { firstName: true, lastName: true, email: true },
  });
  const pdaFullName = [pdaUser?.firstName, pdaUser?.lastName].filter(Boolean).join(' ') || pdaUser?.email || '';

  const allReleases = await db.query.releases.findMany({
    where: and(
      eq(releases.userId, patientId),
      eq(releases.releaseAuthAgent, true),
    ),
    with: { providers: { columns: { providerName: true, insurance: true, providerType: true }, orderBy: (p, { asc }) => [asc(p.order)] } },
  });

  const releaseOptions = allReleases
    .filter(r => {
      const agentName = [r.authAgentFirstName, r.authAgentLastName].filter(Boolean).join(' ');
      return agentName === pdaFullName || r.authAgentEmail === pdaUser?.email;
    })
    .filter(r => r.releaseCode)
    .map(r => ({
      id: r.id,
      releaseCode: r.releaseCode!,
      providerNames: r.providers.map(p => p.providerType === 'Insurance' ? (p.insurance || p.providerName) : p.providerName),
    }));

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
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>{patientName} Records</Title>
        {relation.healthRecordsPermission === 'editor' && (
          <UploadFileButton patientId={patientId} releases={releaseOptions} />
        )}
      </Group>
      <MyRecordsTable rows={rows} releases={releaseOptions} />
    </>
  );
}
