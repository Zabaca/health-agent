import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles, userProviders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import PageHeader from "@/components/shared/PageHeader";
import MyRecordsTable from "@/components/records/MyRecordsTable";
import UploadFileButton from "@/components/records/UploadFileButton";

export const metadata = { title: "My Records" };

export default async function MyRecordsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [files, myProviders] = await Promise.all([
    db.query.incomingFiles.findMany({
      where: eq(incomingFiles.patientId, userId),
      with: { faxLog: true, uploadLog: { with: { uploadedBy: true } } },
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    }),
    db.select({ id: userProviders.id, providerName: userProviders.providerName, providerType: userProviders.providerType, insurance: userProviders.insurance })
      .from(userProviders)
      .where(eq(userProviders.userId, userId)),
  ]);

  const providerOptions = myProviders.map((p) => ({
    id: p.id,
    name: (p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName) ?? "",
  }));

  const providerById = new Map(providerOptions.map(p => [p.id, p.name]));

  const rows = files.map(f => {
    const uploader = f.uploadLog?.uploadedBy;
    return {
      id: f.id,
      createdAt: f.createdAt,
      fileType: f.fileType,
      fileURL: f.fileURL,
      originalName: f.uploadLog?.originalName ?? null,
      userProviderId: f.userProviderId ?? null,
      providerName: f.userProviderId ? (providerById.get(f.userProviderId) ?? null) : null,
      pagecount: f.faxLog?.pagecount ?? null,
      uploadedBy: uploader
        ? [uploader.firstName, uploader.lastName].filter(Boolean).join(' ') || uploader.email
        : null,
    };
  });

  return (
    <>
      <PageHeader title="My Health Records" action={<UploadFileButton providers={providerOptions} />} />
      <MyRecordsTable rows={rows} providers={providerOptions} />
    </>
  );
}
