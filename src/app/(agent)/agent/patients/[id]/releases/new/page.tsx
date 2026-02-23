import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, userProviders, patientAssignments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import StaffReleaseForm from "@/components/staff/StaffReleaseForm";

export const metadata = { title: "New Release — Agent Portal" };

export default async function AgentNewReleasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id: patientId } = await params;

  if (!session?.user?.id) notFound();

  const assignment = await db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, patientId),
      eq(patientAssignments.assignedToId, session.user.id)
    ),
  });
  if (!assignment) notFound();

  const [patient, agentUser, providers] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, patientId) }),
    db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
    db.query.userProviders.findMany({ where: eq(userProviders.userId, patientId) }),
  ]);

  if (!patient) notFound();

  const agentInfo = {
    firstName: agentUser?.firstName ?? "",
    lastName: agentUser?.lastName ?? "",
    organization: undefined as string | undefined,
    address: agentUser?.address ?? "",
    phone: agentUser?.phoneNumber ?? "",
    email: agentUser?.email ?? "",
  };

  return (
    <StaffReleaseForm
      mode="agent"
      patientId={patientId}
      agentInfo={agentInfo}
      savedProviders={providers}
      redirectAfterSave={`/agent/patients/${patientId}`}
      defaultValues={{
        firstName: patient.firstName ?? "",
        middleName: patient.middleName ?? "",
        lastName: patient.lastName ?? "",
        dateOfBirth: patient.dateOfBirth ?? "",
        mailingAddress: patient.address ?? "",
        phoneNumber: patient.phoneNumber ?? "",
        email: patient.email,
        ssn: patient.ssn ?? "",
      }}
    />
  );
}
