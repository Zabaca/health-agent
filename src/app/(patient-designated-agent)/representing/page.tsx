import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Title, Text, Stack } from "@mantine/core";

export const metadata = { title: "Representing" };

export default async function RepresentingIndexPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const relations = await db.query.patientDesignatedAgents.findMany({
    where: and(
      eq(patientDesignatedAgents.agentUserId, session.user.id),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
  });

  if (relations.length === 1) {
    redirect(`/representing/${relations[0].patientId}`);
  }

  if (relations.length === 0) {
    return (
      <Stack align="center" mt="xl">
        <Title order={3}>No patients found</Title>
        <Text c="dimmed">You are not currently representing any patients.</Text>
      </Stack>
    );
  }

  return (
    <Stack mt="xl">
      <Title order={2}>Select a patient</Title>
      <Text c="dimmed">You are representing multiple patients. Select one from the navigation.</Text>
    </Stack>
  );
}
