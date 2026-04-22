import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments, userProviders, patientDesignatedAgents } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import ReleaseForm from "@/components/release-form/ReleaseForm";
import { decrypt } from "@/lib/crypto";
import type { RecipientOption } from "@/components/release-form/AuthorizationSection";

export const metadata = { title: "New Release — Medical Record Release" };

export default async function NewReleasePage({ searchParams }: { searchParams: { redirect?: string } }) {
  const redirectTo = searchParams.redirect;
  const session = await auth();
  const userId = session?.user?.id;

  const [user, assignment, providers, pdaRelations] = await Promise.all([
    userId ? db.query.users.findFirst({ where: eq(users.id, userId) }) : undefined,
    userId ? db.query.patientAssignments.findFirst({ where: eq(patientAssignments.patientId, userId) }) : undefined,
    userId ? db.query.userProviders.findMany({ where: eq(userProviders.userId, userId) }) : Promise.resolve([]),
    userId ? db.query.patientDesignatedAgents.findMany({
      where: and(
        eq(patientDesignatedAgents.patientId, userId),
        eq(patientDesignatedAgents.status, 'accepted'),
      ),
      with: { agentUser: true },
    }) : Promise.resolve([]),
  ]);

  const assignedAgent = assignment
    ? await db.query.users.findFirst({ where: eq(users.id, assignment.assignedToId) })
    : null;

  const recipients: RecipientOption[] = [];
  if (assignedAgent) {
    recipients.push({
      id: assignedAgent.id,
      type: 'agent',
      label: [assignedAgent.firstName, assignedAgent.lastName].filter(Boolean).join(' ') || assignedAgent.email,
      firstName: assignedAgent.firstName,
      lastName: assignedAgent.lastName,
      email: assignedAgent.email,
      phoneNumber: assignedAgent.phoneNumber,
      address: assignedAgent.address,
    });
  }
  for (const rel of pdaRelations) {
    if (!rel.agentUser) continue;
    const u = rel.agentUser;
    recipients.push({
      id: rel.id,
      type: 'pda',
      label: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
      relationship: rel.relationship ?? undefined,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      address: u.address,
    });
  }

  return (
    <ReleaseForm
      savedProviders={providers}
      recipients={recipients}
      redirectTo={redirectTo}
      defaultValues={{
        email:          session?.user?.email ?? "",
        firstName:      user?.firstName      ?? "",
        middleName:     user?.middleName      ?? "",
        lastName:       user?.lastName        ?? "",
        dateOfBirth:    user?.dateOfBirth ? decrypt(user.dateOfBirth) : "",
        mailingAddress: user?.address         ?? "",
        phoneNumber:    user?.phoneNumber     ?? "",
        ssn:            user?.ssn ? decrypt(user.ssn) : "",
      }}
    />
  );
}
