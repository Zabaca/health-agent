import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, userProviders } from "@/lib/db/schema";
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

  const [patient, adminUser, providers] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, patientId) }),
    session?.user?.id ? db.query.users.findFirst({ where: eq(users.id, session.user.id) }) : null,
    db.query.userProviders.findMany({ where: eq(userProviders.userId, patientId) }),
  ]);

  if (!patient) notFound();

  const agentInfo = {
    firstName: adminUser?.firstName ?? "",
    lastName: adminUser?.lastName ?? "",
    organization: undefined as string | undefined,
    address: adminUser?.address ?? "",
    phone: adminUser?.phoneNumber ?? "",
    email: adminUser?.email ?? "",
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
