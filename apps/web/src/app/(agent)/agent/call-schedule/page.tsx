import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledCalls } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Title } from "@mantine/core";
import StaffScheduledCallsTable from "@/components/schedule-call/StaffScheduledCallsTable";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Call Schedule — Agent Portal" };

export default async function AgentCallSchedulePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const calls = await db.query.scheduledCalls.findMany({
    where: eq(scheduledCalls.agentId, userId),
    with: {
      patient: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [desc(scheduledCalls.scheduledAt)],
  });

  return (
    <>
      <Title order={2} mb="lg">Call Schedule</Title>
      <StaffScheduledCallsTable calls={calls} basePath="/agent/call-schedule" />
    </>
  );
}
