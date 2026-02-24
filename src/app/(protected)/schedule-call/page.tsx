import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Title, Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import ScheduleCallForm from "@/components/schedule-call/ScheduleCallForm";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Schedule a Call — Medical Record Release" };

export default async function ScheduleCallPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const assignment = await db.query.patientAssignments.findFirst({
    where: eq(patientAssignments.patientId, userId),
    with: {
      assignedTo: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          address: true,
        },
      },
    },
  });

  return (
    <>
      <Title order={2} mb="lg">Schedule a Call</Title>
      {!assignment ? (
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          You do not have an assigned agent yet. Please contact support.
        </Alert>
      ) : (
        <ScheduleCallForm agentInfo={assignment.assignedTo} />
      )}
    </>
  );
}
