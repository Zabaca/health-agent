import { auth } from "@/auth";
import { db } from "@/lib/db";
import { incomingFiles } from "@/lib/db/schema";
import { Group, Title } from "@mantine/core";
import RecordsTable from "@/components/records/RecordsTable";
import UploadFileButton from "@/components/records/UploadFileButton";

export const metadata = { title: "Received Files — Admin Portal" };

export default async function AdminRecordsPage() {
  await auth();

  const files = await db.query.incomingFiles.findMany({
    with: { faxLog: true },
    orderBy: (f, { desc }) => [desc(f.createdAt)],
  });

  const patientIds = Array.from(new Set(files.map(f => f.patientId).filter(Boolean))) as string[];
  const patients = patientIds.length
    ? await db.query.users.findMany({ where: (u, { inArray }) => inArray(u.id, patientIds) })
    : [];
  const patientMap = new Map(patients.map(p => [p.id, p]));

  const rows = files.map(f => {
    const patient = f.patientId ? patientMap.get(f.patientId) : null;
    return {
      id: f.id,
      createdAt: f.createdAt,
      source: f.source,
      pagecount: f.faxLog?.pagecount ?? null,
      cid: f.faxLog?.cid ?? null,
      dnis: f.faxLog?.dnis ?? null,
      patientName: patient ? [patient.firstName, patient.lastName].filter(Boolean).join(' ') || patient.email : null,
    };
  });

  return (
    <>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Received Files</Title>
        <UploadFileButton />
      </Group>
      <RecordsTable rows={rows} basePath="/admin/records" showAssignedTo />
    </>
  );
}
