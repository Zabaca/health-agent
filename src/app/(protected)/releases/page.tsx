import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, users, userProviders } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Button } from "@mantine/core";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import ReleaseList from "@/components/dashboard/ReleaseList";
import ReleasePrerequisites from "@/components/releases/ReleasePrerequisites";
import type { ReleaseSummary } from "@/types/release";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Releases — Medical Record Release" };

export default async function ReleasesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [user, providerRows, allReleases] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId), columns: { profileComplete: true } }),
    db.query.userProviders.findMany({ where: eq(userProviders.userId, userId), columns: { id: true }, limit: 1 }),
    db.query.releases.findMany({
      where: eq(releasesTable.userId, userId),
      columns: { id: true, firstName: true, lastName: true, createdAt: true, updatedAt: true, voided: true, authSignatureImage: true, releaseCode: true, releaseAuthAgent: true, authAgentFirstName: true, authAgentLastName: true },
      with: { providers: { columns: { providerName: true, insurance: true, providerType: true }, orderBy: (p, { asc }) => [asc(p.order)] } },
      orderBy: [desc(releasesTable.updatedAt)],
    }),
  ]);

  const profileComplete = user?.profileComplete ?? false;
  const providerAdded = providerRows.length > 0;
  const prereqsMet = profileComplete && providerAdded;

  if (!prereqsMet) {
    return (
      <ReleasePrerequisites
        profileComplete={profileComplete}
        providerAdded={providerAdded}
      />
    );
  }

  const releases: ReleaseSummary[] = allReleases.map((r) => ({
    ...r,
    providerNames: r.providers.map((p) => p.providerType === 'Insurance' ? (p.insurance || p.providerName) : p.providerName),
  }));

  return (
    <>
      <PageHeader
        title="HIPAA Releases"
        action={<Button component={Link} href="/releases/new">+ New Release</Button>}
      />
      <ReleaseList releases={releases} />
    </>
  );
}
