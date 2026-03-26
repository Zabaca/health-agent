import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, userProviders } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { Breadcrumbs, Anchor, Text } from "@mantine/core";
import Link from "next/link";
import RepresentingProvidersForm from "@/components/representing/RepresentingProvidersForm";
import type { MyProviderFormData } from "@/lib/schemas/release";

export const metadata = { title: "Patient Providers" };

export default async function RepresentingProvidersPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { patientId } = await params;

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, session.user.id),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
    with: { patient: true },
  });

  if (!relation || !relation.canManageProviders) notFound();

  const rows = await db
    .select()
    .from(userProviders)
    .where(eq(userProviders.userId, patientId))
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

  const patientName =
    [relation.patient?.firstName, relation.patient?.lastName].filter(Boolean).join(' ') ||
    relation.patient?.email ||
    'Patient';

  return (
    <>
      <Breadcrumbs mb="md">
        <Anchor component={Link} href={`/representing/${patientId}`} size="sm">{patientName}</Anchor>
        <Text size="sm">Providers</Text>
      </Breadcrumbs>
      <RepresentingProvidersForm defaultValues={providers} patientId={patientId} />
    </>
  );
}
