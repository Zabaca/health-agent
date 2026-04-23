import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import ScheduleCallForm from "@/components/schedule-call/ScheduleCallForm";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Schedule a Call — Medical Record Release" };

// Feature temporarily hidden (JAM-282). Flip to true to re-enable.
const FEATURE_ENABLED: boolean = false;

export default async function ScheduleCallPage() {
  if (!FEATURE_ENABLED) redirect("/dashboard");

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
