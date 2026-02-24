import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ReleaseForm from "@/components/release-form/ReleaseForm";
import { decrypt } from "@/lib/crypto";

export const metadata = { title: "New Release — Medical Record Release" };

export default async function NewReleasePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [user, assignment] = await Promise.all([
    userId ? db.query.users.findFirst({ where: eq(users.id, userId) }) : undefined,
    userId ? db.query.patientAssignments.findFirst({ where: eq(patientAssignments.patientId, userId) }) : undefined,
  ]);

  const assignedAgent = assignment
    ? await db.query.users.findFirst({ where: eq(users.id, assignment.assignedToId) })
    : null;

  return (
    <ReleaseForm
      assignedAgent={assignedAgent ? {
        firstName: assignedAgent.firstName,
        lastName: assignedAgent.lastName,
        email: assignedAgent.email,
        phoneNumber: assignedAgent.phoneNumber,
        address: assignedAgent.address,
      } : null}
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
