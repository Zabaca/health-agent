import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledCalls } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@mantine/core";
import PageHeader from "@/components/shared/PageHeader";
import Link from "next/link";
import ScheduledCallsTable from "@/components/schedule-call/ScheduledCallsTable";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Scheduled Calls — Medical Record Release" };

// Feature temporarily hidden (JAM-282). Flip to true to re-enable.
const FEATURE_ENABLED: boolean = false;

export default async function ScheduledCallsPage() {
  if (!FEATURE_ENABLED) redirect("/dashboard");

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const calls = await db.query.scheduledCalls.findMany({
    where: eq(scheduledCalls.patientId, userId),
    with: {
      agent: {
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
    orderBy: [desc(scheduledCalls.scheduledAt)],
  });

  return (
    <>
      <PageHeader
        title="Scheduled Calls"
        action={<Button component={Link} href="/schedule-call">+ Schedule a Call</Button>}
      />
      <ScheduledCallsTable calls={calls} />
    </>
  );
}
