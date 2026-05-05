import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientAssignments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import PdaAccountForm from "./PdaAccountForm";

export const metadata = { title: "My Account" };

export default async function PdaAccountPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const [user, patientAssignment] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { firstName: true, lastName: true, phoneNumber: true, address: true, avatarUrl: true },
    }),
    db.query.patientAssignments.findFirst({
      where: eq(patientAssignments.patientId, session.user.id),
      columns: { id: true },
    }),
  ]);

  if (!user) notFound();

  return (
    <PdaAccountForm
      isPatient={!!patientAssignment}
      defaultValues={{
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phoneNumber: user.phoneNumber ?? "",
        address: user.address ?? "",
        avatarUrl: user.avatarUrl ?? null,
      }}
    />
  );
}
