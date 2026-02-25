import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Title, Text, Group } from "@mantine/core";
import CreateAgentModal from "@/components/admin/CreateAgentModal";
import AgentsTable from "@/components/admin/AgentsTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agents — Admin Portal" };

export default async function AgentsPage() {
  await auth();

  const agents = await db.query.users.findMany({
    where: eq(users.type, "agent"),
  });

  return (
    <>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>Agents</Title>
        <CreateAgentModal />
      </Group>

      {agents.length === 0 ? (
        <Text c="dimmed">No agents yet. Create one to get started.</Text>
      ) : (
        <AgentsTable agents={agents} />
      )}
    </>
  );
}
