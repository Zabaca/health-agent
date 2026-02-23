import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { Title, Text } from "@mantine/core";
import PatientsTable from "@/components/staff/PatientsTable";

export const metadata = { title: "Dashboard — Agent Portal" };

export default async function AgentDashboardPage() {
  const session = await auth();

  const assignments = session?.user?.id
    ? await db.query.patientAssignments.findMany({
        where: eq(patientAssignments.assignedToId, session.user.id),
      })
    : [];

  const patients =
    assignments.length > 0
      ? await db.query.users.findMany({
          where: inArray(users.id, assignments.map((a) => a.patientId)),
        })
      : [];

  return (
    <>
      <Title order={2} mb="lg">My Patients</Title>
      {patients.length === 0 ? (
        <Text c="dimmed">No patients assigned yet.</Text>
      ) : (
        <PatientsTable patients={patients} basePath="/agent/patients" />
      )}
    </>
  );
}
