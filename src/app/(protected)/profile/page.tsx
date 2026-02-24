import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfileForm from "@/components/profile/ProfileForm";
import { decrypt } from "@/lib/crypto";

export const metadata = { title: "My Profile — Medical Record Release" };

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return (
    <ProfileForm
      defaultValues={{
        firstName:   user?.firstName   ?? "",
        middleName:  user?.middleName  ?? "",
        lastName:    user?.lastName    ?? "",
        dateOfBirth: user?.dateOfBirth ? decrypt(user.dateOfBirth) : "",
        address:     user?.address     ?? "",
        phoneNumber: user?.phoneNumber ?? "",
        ssn:         user?.ssn         ? decrypt(user.ssn) : "",
      }}
    />
  );
}
