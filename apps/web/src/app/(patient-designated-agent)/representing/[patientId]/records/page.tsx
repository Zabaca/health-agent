import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, incomingFiles, releases, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { Breadcrumbs, Anchor, Text } from "@mantine/core";
import Link from "next/link";
import MyRecordsTable from "@/components/records/MyRecordsTable";
import UploadFileButton from "@/components/records/UploadFileButton";
import BreadcrumbHeader from "@/components/shared/BreadcrumbHeader";

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
    with: { patient: true },
  });

  if (!relation || !relation.healthRecordsPermission) notFound();

  const files = await db.query.incomingFiles.findMany({
    where: and(eq(incomingFiles.patientId, patientId), isNull(incomingFiles.deletedAt)),
    with: { faxLog: true, uploadLog: { with: { uploadedBy: true } } },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });

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
      <BreadcrumbHeader
        breadcrumb={
          <Breadcrumbs>
            <Anchor component={Link} href={`/representing/${patientId}`}>{patientName}</Anchor>
            <Text>Records</Text>
          </Breadcrumbs>
        }
        action={relation.healthRecordsPermission === 'editor'
          ? <UploadFileButton patientId={patientId} releases={releaseOptions} />
          : undefined}
        mb="lg"
      />
      <MyRecordsTable rows={rows} releases={releaseOptions} readOnly={relation.healthRecordsPermission !== 'editor'} />
    </>
  );
}
