import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledCalls } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Title } from "@mantine/core";
import StaffCallDetail from "@/components/schedule-call/StaffCallDetail";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AgentCallDetailPage({ params }: Props) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const { id } = await params;

  const call = await db.query.scheduledCalls.findFirst({
    where: and(eq(scheduledCalls.id, id), eq(scheduledCalls.agentId, userId)),
    with: {
      patient: {
        columns: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          dateOfBirth: true,
          address: true,
          phoneNumber: true,
          ssn: true,
        },
      },
    },
  });

  if (!call) notFound();

  return (
    <>
      <Title order={2} mb="lg">Call Details</Title>
      <StaffCallDetail
        callId={call.id}
        patient={call.patient}
        scheduledAt={call.scheduledAt}
        status={call.status}
        backHref="/agent/call-schedule"
      />
    </>
  );
}
