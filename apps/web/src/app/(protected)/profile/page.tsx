import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, patientDesignatedAgents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import ProfileForm from "@/components/profile/ProfileForm";
import { decrypt } from "@/lib/crypto";

export const metadata = { title: "My Profile — Medical Record Release" };

export default async function ProfilePage({ searchParams }: { searchParams: { redirect?: string } }) {
  const { redirect } = searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [user, pdaRelation] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.patientDesignatedAgents.findFirst({
      where: and(
        eq(patientDesignatedAgents.agentUserId, userId),
        eq(patientDesignatedAgents.status, "accepted"),
      ),
      columns: { id: true },
    }),
  ]);

  return (
    <ProfileForm
      maw="100%"
      redirectTo={redirect}
      isPda={!!pdaRelation}
      defaultValues={{
        firstName:   user?.firstName   ?? "",
        middleName:  user?.middleName  ?? "",
        lastName:    user?.lastName    ?? "",
        dateOfBirth: user?.dateOfBirth ? decrypt(user.dateOfBirth) : "",
        address:     user?.address     ?? "",
        phoneNumber: user?.phoneNumber ?? "",
        ssn:         user?.ssn         ? decrypt(user.ssn) : "",
        avatarUrl:   user?.avatarUrl   ?? "",
      }}
    />
  );
}
