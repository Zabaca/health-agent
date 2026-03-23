import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userProviders } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import MyProvidersForm from "@/components/my-providers/MyProvidersForm";
import type { MyProviderFormData } from "@/lib/schemas/release";

export const metadata = { title: "My Providers — Medical Record Release" };

export default async function MyProvidersPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const rows = await db
    .select()
    .from(userProviders)
    .where(eq(userProviders.userId, userId))
    .orderBy(asc(userProviders.order));

  const providers: MyProviderFormData[] = rows.map((r) => ({
    providerName: r.providerName,
    providerType: r.providerType as MyProviderFormData["providerType"],
    physicianName: r.physicianName ?? "",
    patientId: r.patientId ?? "",
    insurance: r.insurance ?? "",
    patientMemberId: r.patientMemberId ?? "",
    groupId: r.groupId ?? "",
    planName: r.planName ?? "",
    phone: r.phone ?? "",
    fax: r.fax ?? "",
    providerEmail: r.providerEmail ?? "",
    address: r.address ?? "",
    membershipIdFront: r.membershipIdFront ?? "",
    membershipIdBack: r.membershipIdBack ?? "",
  }));

  return <MyProvidersForm defaultValues={providers} />;
}
