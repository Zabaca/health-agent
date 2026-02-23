import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { Title, Text } from "@mantine/core";
import PatientsTable from "@/components/staff/PatientsTable";

export const metadata = { title: "Dashboard — Admin Portal" };

export default async function AdminDashboardPage() {
  await auth();

  const allPatients = await db.query.users.findMany({
    where: eq(users.type, 'patient'),
  });

  const assignments = await db.query.patientAssignments.findMany();
  const assigneeIds = Array.from(new Set(assignments.map((a) => a.assignedToId)));
  const assignees = assigneeIds.length
    ? await db.query.users.findMany({ where: inArray(users.id, assigneeIds) })
    : [];

  const assigneeMap = new Map(assignees.map((u) => [u.id, u]));
  const assignmentMap = new Map(assignments.map((a) => [a.patientId, a]));

  const patients = allPatients.map((p) => {
    const assignment = assignmentMap.get(p.id);
    const assignee = assignment ? assigneeMap.get(assignment.assignedToId) : undefined;
    return { ...p, assignedTo: assignee ?? null };
  });

  return (
    <>
      <Title order={2} mb="lg">Patients</Title>
      {patients.length === 0 ? (
        <Text c="dimmed">No patients registered yet.</Text>
      ) : (
        <PatientsTable patients={patients} basePath="/admin/patients" showAssignedTo />
      )}
    </>
  );
}
