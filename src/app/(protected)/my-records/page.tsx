import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles, releases as releasesTable, providers as releaseProvidersTable } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import PageHeader from "@/components/shared/PageHeader";
import MyRecordsTable from "@/components/records/MyRecordsTable";
import UploadFileButton from "@/components/records/UploadFileButton";

export const metadata = { title: "My Records" };

export default async function MyRecordsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [files, releases] = await Promise.all([
    db.query.incomingFiles.findMany({
      where: eq(incomingFiles.patientId, userId),
      with: { faxLog: true, uploadLog: { with: { uploadedBy: true } } },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    }),
    db.query.releases.findMany({
      where: eq(releasesTable.userId, userId),
      columns: { id: true, releaseCode: true },
    }),
  ]);

  const releaseIds = releases.map(r => r.id);
  const releaseProviders = releaseIds.length
    ? await db
        .select({ releaseId: releaseProvidersTable.releaseId, providerName: releaseProvidersTable.providerName, insurance: releaseProvidersTable.insurance, providerType: releaseProvidersTable.providerType })
        .from(releaseProvidersTable)
        .where(inArray(releaseProvidersTable.releaseId, releaseIds))
    : [];

  const providersByRelease = new Map<string, string[]>();
  for (const p of releaseProviders) {
    const names = providersByRelease.get(p.releaseId) ?? [];
    const displayName = p.providerType === 'Insurance' ? (p.insurance || p.providerName) : p.providerName;
    names.push(displayName);
    providersByRelease.set(p.releaseId, names);
  }

  const releaseOptions = releases
    .filter(r => r.releaseCode)
    .map(r => ({
      id: r.id,
      releaseCode: r.releaseCode!,
      providerNames: providersByRelease.get(r.id) ?? [],
    }));

  const rows = files.map(f => {
    const uploader = f.uploadLog?.uploadedBy;
    return {
      id: f.id,
      createdAt: f.createdAt,
      fileType: f.fileType,
      fileURL: f.fileURL,
      originalName: f.uploadLog?.originalName ?? null,
      releaseCode: f.releaseCode ?? null,
      pagecount: f.faxLog?.pagecount ?? null,
      uploadedBy: uploader
        ? [uploader.firstName, uploader.lastName].filter(Boolean).join(' ') || uploader.email
        : null,
    };
  });

  return (
    <>
      <PageHeader title="My Health Records" action={<UploadFileButton releases={releaseOptions} />} />
      <MyRecordsTable rows={rows} releases={releaseOptions} />
    </>
  );
}
