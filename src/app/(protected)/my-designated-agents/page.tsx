import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { patientDesignatedAgents, patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Title } from "@mantine/core";
import MyDesignatedAgentsClient from "@/components/designated-agents/MyDesignatedAgentsClient";

export const metadata = { title: "My Designated Agents" };

export default async function MyDesignatedAgentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.type === 'admin' || session.user.isAgent) redirect("/dashboard");

  const patientId = session.user.id;

  const [pdas, assignment] = await Promise.all([
    db.query.patientDesignatedAgents.findMany({
      where: eq(patientDesignatedAgents.patientId, patientId),
      with: { agentUser: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    }),
    db.query.patientAssignments.findFirst({
      where: eq(patientAssignments.patientId, patientId),
      with: { assignedTo: true },
    }),
  ]);

  const designatedAgents = pdas.map(p => ({
    id: p.id,
    inviteeEmail: p.inviteeEmail,
    relationship: p.relationship,
    status: p.status as 'pending' | 'accepted' | 'revoked',
    healthRecordsPermission: p.healthRecordsPermission as 'viewer' | 'editor' | null,
    healthRecordsScope: p.healthRecordsScope as 'all' | 'specific' | null,
    manageProvidersPermission: p.manageProvidersPermission as 'viewer' | 'editor' | null,
    releasePermission: p.releasePermission as 'viewer' | 'editor' | null,
    createdAt: p.createdAt,
    tokenExpiresAt: p.tokenExpiresAt,
    agentUser: p.agentUser
      ? {
          id: p.agentUser.id,
          email: p.agentUser.email,
          firstName: p.agentUser.firstName,
          lastName: p.agentUser.lastName,
        }
      : null,
  }));

  const assignedAgent = assignment
    ? {
        id: assignment.assignedTo.id,
        email: assignment.assignedTo.email,
        firstName: assignment.assignedTo.firstName,
        lastName: assignment.assignedTo.lastName,
      }
    : null;

  return (
    <>
      <Title order={2} mb="lg">My Designated Agents</Title>
      <MyDesignatedAgentsClient
        assignedAgent={assignedAgent}
        designatedAgents={designatedAgents}
      />
    </>
  );
}
