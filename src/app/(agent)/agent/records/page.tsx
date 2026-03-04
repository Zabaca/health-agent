import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { isNull } from "drizzle-orm";
import { Title } from "@mantine/core";
import RecordsTable from "@/components/records/RecordsTable";

export const metadata = { title: "Received Files — Agent Portal" };

export default async function AgentRecordsPage() {
  await auth();

  const files = await db.query.incomingFiles.findMany({
    where: isNull(incomingFiles.patientId),
    with: { faxLog: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });

  const rows = files.map(f => ({
    id: f.id,
    createdAt: f.createdAt,
    source: f.source,
    pagecount: f.faxLog?.pagecount ?? null,
    cid: f.faxLog?.cid ?? null,
    dnis: f.faxLog?.dnis ?? null,
  }));

  return (
    <>
      <Title order={2} mb="lg">Received Files (Unassigned)</Title>
      <RecordsTable rows={rows} basePath="/agent/records" />
    </>
  );
}
