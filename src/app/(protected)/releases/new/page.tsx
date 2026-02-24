import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ReleaseForm from "@/components/release-form/ReleaseForm";
import { decrypt } from "@/lib/crypto";

export const metadata = { title: "New Release — Medical Record Release" };

export default async function NewReleasePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const user = userId
    ? await db.query.users.findFirst({ where: eq(users.id, userId) })
    : undefined;

  return (
    <ReleaseForm
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
