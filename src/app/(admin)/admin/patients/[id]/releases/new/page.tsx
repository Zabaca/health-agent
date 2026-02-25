import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, userProviders, patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import StaffReleaseForm from "@/components/staff/StaffReleaseForm";
import { decrypt } from "@/lib/crypto";

export const metadata = { title: "New Release — Admin Portal" };

export default async function AdminNewReleasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id: patientId } = await params;

  const [patient, providers, assignment] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, patientId) }),
    db.query.userProviders.findMany({ where: eq(userProviders.userId, patientId) }),
    db.query.patientAssignments.findFirst({ where: eq(patientAssignments.patientId, patientId) }),
  ]);

  if (!patient) notFound();

  const assignedAgent = assignment
    ? await db.query.users.findFirst({ where: eq(users.id, assignment.assignedToId) })
    : null;

  const agentInfo = {
    firstName: assignedAgent?.firstName ?? "",
    lastName: assignedAgent?.lastName ?? "",
    organization: undefined as string | undefined,
    address: assignedAgent?.address ?? "",
    phone: assignedAgent?.phoneNumber ?? "",
    email: assignedAgent?.email ?? "",
  };

  return (
    <StaffReleaseForm
      mode="admin"
      patientId={patientId}
      agentInfo={agentInfo}
      savedProviders={providers}
      redirectAfterSave={`/admin/patients/${patientId}`}
      defaultValues={{
        firstName: patient.firstName ?? "",
        middleName: patient.middleName ?? "",
        lastName: patient.lastName ?? "",
        dateOfBirth: patient.dateOfBirth ? decrypt(patient.dateOfBirth) : "",
        mailingAddress: patient.address ?? "",
        phoneNumber: patient.phoneNumber ?? "",
        email: patient.email,
        ssn: patient.ssn ? decrypt(patient.ssn) : "",
      }}
    />
  );
}
