import { auth } from "@/auth";
import { db } from "@/lib/db";
import { scheduledCalls } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Title, Paper, Stack, Text, Badge } from "@mantine/core";
import PatientCallActions from "@/components/schedule-call/PatientCallActions";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScheduledCallPage({ params }: Props) {
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

  const agentName =
    call.agent.firstName || call.agent.lastName
      ? `${call.agent.firstName ?? ""} ${call.agent.lastName ?? ""}`.trim()
      : call.agent.email;

  return (
    <>
      <Title order={2} mb="lg">Scheduled Call</Title>
      <Paper withBorder p="lg" radius="md" maw={500}>
        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} c="dimmed" mb={2}>Agent</Text>
            <Text fw={500}>{agentName}</Text>
            <Text size="sm">{call.agent.email}</Text>
            {call.agent.phoneNumber && <Text size="sm">{call.agent.phoneNumber}</Text>}
            {call.agent.address && <Text size="sm">{call.agent.address}</Text>}
          </div>

          <div>
            <Text size="sm" fw={500} c="dimmed" mb={2}>Scheduled For</Text>
            <Text>{new Date(call.scheduledAt).toLocaleString()}</Text>
          </div>

          <div>
            <Text size="sm" fw={500} c="dimmed" mb={2}>Status</Text>
            <Badge color={call.status === 'scheduled' ? 'green' : 'gray'}>
              {call.status}
            </Badge>
          </div>

          <PatientCallActions
            callId={call.id}
            canReschedule={call.status === 'scheduled'}
          />
        </Stack>
      </Paper>
    </>
  );
}
