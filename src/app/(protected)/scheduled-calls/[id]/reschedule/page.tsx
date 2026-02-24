import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledCalls } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Title } from "@mantine/core";
import RescheduleCallForm from "@/components/schedule-call/RescheduleCallForm";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RescheduleCallPage({ params }: Props) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const { id } = await params;

  const call = await db.query.scheduledCalls.findFirst({
    where: and(eq(scheduledCalls.id, id), eq(scheduledCalls.patientId, userId)),
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
  });

  if (!call) notFound();
  if (call.status === 'cancelled') redirect(`/scheduled-calls/${id}`);

  return (
    <>
      <Title order={2} mb="lg">Reschedule Call</Title>
      <RescheduleCallForm
        callId={call.id}
        agentInfo={call.agent}
        currentScheduledAt={call.scheduledAt}
      />
    </>
  );
}
