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
    physicianName: r.physicianName ?? undefined,
    patientId: r.patientId ?? undefined,
    insurance: r.insurance ?? undefined,
    patientMemberId: r.patientMemberId ?? undefined,
    groupId: r.groupId ?? undefined,
    planName: r.planName ?? undefined,
    phone: r.phone ?? undefined,
    fax: r.fax ?? undefined,
    providerEmail: r.providerEmail ?? undefined,
    address: r.address ?? undefined,
    membershipIdFront: r.membershipIdFront ?? undefined,
    membershipIdBack: r.membershipIdBack ?? undefined,
  }));

  return <MyProvidersForm defaultValues={providers} />;
}
