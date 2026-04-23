import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, users, userProviders } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import StaffReleaseForm from "@/components/staff/StaffReleaseForm";
import { decrypt } from "@/lib/crypto";

export const metadata = { title: "New Release Request" };

export default async function RepresentingNewReleasePage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { patientId } = await params;

  const [relation, pda] = await Promise.all([
    db.query.patientDesignatedAgents.findFirst({
      where: and(
        eq(patientDesignatedAgents.agentUserId, session.user.id),
        eq(patientDesignatedAgents.patientId, patientId),
        eq(patientDesignatedAgents.status, 'accepted'),
      ),
      with: { patient: true },
    }),
    db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
  ]);

  if (!relation || relation.releasePermission !== 'editor') notFound();
  if (!pda) notFound();

  const patient = relation.patient;
  if (!patient) notFound();

  const savedProviders = await db
    .select()
    .from(userProviders)
    .where(eq(userProviders.userId, patientId))
    .orderBy(asc(userProviders.order));

  return (
    <StaffReleaseForm
      mode="pda"
      patientId={patientId}
      agentInfo={{
        firstName: pda.firstName ?? "",
        lastName: pda.lastName ?? "",
        address: pda.address ?? "",
        phone: pda.phoneNumber ?? "",
        email: pda.email,
        relationship: relation.relationship ?? null,
      }}
      savedProviders={savedProviders}
      redirectAfterSave={`/representing/${patientId}/releases`}
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
