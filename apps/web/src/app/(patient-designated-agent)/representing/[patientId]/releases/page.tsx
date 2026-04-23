import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, releases, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Breadcrumbs, Anchor, Text, Button } from "@mantine/core";
import Link from "next/link";
import ReleasesTable from "./ReleasesTable";
import BreadcrumbHeader from "@/components/shared/BreadcrumbHeader";

export const metadata = { title: "HIPAA Releases" };

export default async function RepresentingReleasesPage({
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
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { email: true },
    }),
  ]);

  if (!relation || !relation.releasePermission) notFound();

  const pdaEmail = pda?.email ?? '';

  const allReleases = await db.query.releases.findMany({
    where: and(
      eq(releases.userId, patientId),
      eq(releases.releaseAuthAgent, true),
    ),
    with: { providers: { columns: { providerName: true, insurance: true, providerType: true }, orderBy: (p, { asc }) => [asc(p.order)] } },
    orderBy: [desc(releases.updatedAt)],
  });

  const myReleases = allReleases.filter(r => r.authAgentEmail === pdaEmail);

  const patientName =
    [relation.patient?.firstName, relation.patient?.lastName].filter(Boolean).join(' ') ||
    relation.patient?.email || 'Patient';

  return (
    <>
      <BreadcrumbHeader
        breadcrumb={
          <Breadcrumbs>
            <Anchor component={Link} href={`/representing/${patientId}`}>{patientName}</Anchor>
            <Text>HIPAA Releases</Text>
          </Breadcrumbs>
        }
        action={relation.releasePermission === 'editor'
          ? <Button component={Link} href={`/representing/${patientId}/releases/new`}>New Release</Button>
          : undefined}
        mb="lg"
      />

      {myReleases.length === 0 ? (
        <Text c="dimmed">No releases yet.{relation.releasePermission === 'editor' && ' Create one to get started.'}</Text>
      ) : (
        <ReleasesTable releases={myReleases} patientId={patientId} />
      )}
    </>
  );
}
