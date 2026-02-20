import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, users } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Button, Group, Title } from "@mantine/core";
import Link from "next/link";
import ReleaseList from "@/components/dashboard/ReleaseList";
import VoidedReleaseList from "@/components/dashboard/VoidedReleaseList";
import ProfileCompletionBanner from "@/components/dashboard/ProfileCompletionBanner";
import type { ReleaseSummary } from "@/types/release";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Dashboard — Medical Record Release" };

export default async function DashboardPage() {
  const session = await auth();

  const userId = session?.user?.id;
  if (!userId) return null;

  const [activeReleases, voidedReleases, user] = await Promise.all([
    db.query.releases.findMany({
      where: and(eq(releasesTable.userId, userId), eq(releasesTable.voided, false)),
      columns: { id: true, firstName: true, lastName: true, createdAt: true, updatedAt: true, voided: true },
      with: { providers: { columns: { providerName: true }, orderBy: (p, { asc }) => [asc(p.order)] } },
      orderBy: [desc(releasesTable.updatedAt)],
    }),
    db.query.releases.findMany({
      where: and(eq(releasesTable.userId, userId), eq(releasesTable.voided, true)),
      columns: { id: true, firstName: true, lastName: true, createdAt: true, updatedAt: true, voided: true },
      with: { providers: { columns: { providerName: true }, orderBy: (p, { asc }) => [asc(p.order)] } },
      orderBy: [desc(releasesTable.updatedAt)],
    }),
    db.query.users.findFirst({ where: eq(users.id, userId) }),
  ]);

  const profileIncomplete =
    !user?.firstName ||
    !user?.middleName ||
    !user?.lastName ||
    !user?.dateOfBirth ||
    !user?.address ||
    !user?.ssn;

  const active: ReleaseSummary[] = activeReleases.map((r) => ({ ...r, providerNames: r.providers.map((p) => p.providerName) }));
  const voided: ReleaseSummary[] = voidedReleases.map((r) => ({ ...r, providerNames: r.providers.map((p) => p.providerName) }));

  return (
    <>
      {profileIncomplete && <ProfileCompletionBanner />}
      <Group justify="space-between" mb="lg">
        <Title order={2}>My Releases</Title>
        <Button component={Link} href="/releases/new">
          + New Release
        </Button>
      </Group>
      <ReleaseList releases={active} />
      {voided.length > 0 && (
        <>
          <Title order={3} mt="xl" mb="lg">Voided Releases</Title>
          <VoidedReleaseList releases={voided} />
        </>
      )}
    </>
  );
}
