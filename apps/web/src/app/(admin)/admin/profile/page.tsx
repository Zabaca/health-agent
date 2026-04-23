import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import StaffProfileFormClient from "@/components/staff/StaffProfileFormClient";

export const metadata = { title: "My Profile — Admin Portal" };

export default async function AdminProfilePage() {
  const session = await auth();

  const user = session?.user?.id
    ? await db.query.users.findFirst({ where: eq(users.id, session.user.id) })
    : null;

  const defaultValues = {
    firstName: user?.firstName ?? "",
    middleName: user?.middleName ?? "",
    lastName: user?.lastName ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    address: user?.address ?? "",
    avatarUrl: user?.avatarUrl ?? undefined,
  };

  return <StaffProfileFormClient defaultValues={defaultValues} mode="admin" />;
}
