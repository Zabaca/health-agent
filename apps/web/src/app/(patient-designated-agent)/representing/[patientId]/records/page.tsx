import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, incomingFiles, userProviders, RECORD_VISIBLE_SOURCES } from "@/lib/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
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

  const [files, patientProviders] = await Promise.all([
    db.query.incomingFiles.findMany({
      where: and(eq(incomingFiles.patientId, patientId), isNull(incomingFiles.deletedAt), inArray(incomingFiles.source, [...RECORD_VISIBLE_SOURCES])),
      with: { faxLog: true, uploadLog: { with: { uploadedBy: true } } },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    }),
    db.select({ id: userProviders.id, providerName: userProviders.providerName, providerType: userProviders.providerType, insurance: userProviders.insurance })
      .from(userProviders)
      .where(eq(userProviders.userId, patientId)),
  ]);

  const patientName =
    [relation.patient?.firstName, relation.patient?.lastName].filter(Boolean).join(' ') ||
    relation.patient?.email ||
    'Patient';

  const providerOptions = patientProviders.map((p) => ({
    id: p.id,
    name: (p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName) ?? "",
  }));

  const providerById = new Map(providerOptions.map(p => [p.id, p.name]));

  const rows = files.map(f => ({
    id: f.id,
    createdAt: f.createdAt,
    fileType: f.fileType,
    fileURL: f.fileURL,
    originalName: f.uploadLog?.originalName ?? null,
    userProviderId: f.userProviderId ?? null,
    providerName: f.userProviderId ? (providerById.get(f.userProviderId) ?? null) : null,
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
          ? <UploadFileButton patientId={patientId} providers={providerOptions} />
          : undefined}
        mb="lg"
      />
      <MyRecordsTable
        rows={rows}
        providers={providerOptions}
        readOnly={relation.healthRecordsPermission !== 'editor'}
      />
    </>
  );
}
