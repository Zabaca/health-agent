import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Title } from "@mantine/core";
import MyRecordsTable from "@/components/records/MyRecordsTable";

export const metadata = { title: "My Records" };

export default async function MyRecordsPage() {
  const session = await auth();

  const files = session?.user?.id
    ? await db.query.incomingFiles.findMany({
        where: eq(incomingFiles.patientId, session.user.id),
        with: { faxLog: true },
        orderBy: (f, { desc }) => [desc(f.createdAt)],
      })
    : [];

  const rows = files.map(f => ({
    id: f.id,
    createdAt: f.createdAt,
    fileType: f.fileType,
    pagecount: f.faxLog?.pagecount ?? null,
  }));

  return (
    <>
      <Title order={2} mb="lg">My Records</Title>
      <MyRecordsTable rows={rows} />
    </>
  );
}
