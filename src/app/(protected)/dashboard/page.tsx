import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, users, userProviders, patientDesignatedAgents, incomingFiles } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import DashboardSummary from "@/components/dashboard/DashboardSummary";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Dashboard — Medical Record Release" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const isPatient = user?.type === 'user' && !session?.user?.isAgent;

  let profileComplete = false;
  let providerCount = 0;
  let pdaCount = 0;
  let recordCount = 0;
  let recentReleases: { id: string; providerNames: string[]; signed: boolean; voided: boolean; createdAt: string }[] = [];
  let releaseCount = 0;
  let releaseCreated = false;

  if (isPatient) {
    const [providerRows, pdaRows, allReleases, recordRows] = await Promise.all([
      db.query.userProviders.findMany({ where: eq(userProviders.userId, userId), columns: { id: true } }),
      db.query.patientDesignatedAgents.findMany({ where: eq(patientDesignatedAgents.patientId, userId), columns: { id: true } }),
      db.query.releases.findMany({
        where: eq(releasesTable.userId, userId),
        columns: { id: true, voided: true, authSignatureImage: true, createdAt: true },
        with: { providers: { columns: { providerName: true, insurance: true, providerType: true }, orderBy: (p, { asc }) => [asc(p.order)] } },
        orderBy: [desc(releasesTable.updatedAt)],
      }),
      db.query.incomingFiles.findMany({ where: eq(incomingFiles.patientId, userId), columns: { id: true } }),
    ]);

    profileComplete = user?.profileComplete ?? false;
    providerCount = providerRows.length;
    pdaCount = pdaRows.length;
    recordCount = recordRows.length;

    const activeReleases = allReleases.filter((r) => !r.voided);
    releaseCreated = activeReleases.length > 0;
    releaseCount = activeReleases.length;

    recentReleases = allReleases.slice(0, 3).map((r) => ({
      id: r.id,
      voided: r.voided,
      signed: !!r.authSignatureImage,
      createdAt: r.createdAt,
      providerNames: r.providers.map((p) => p.providerType === 'Insurance' ? (p.insurance || p.providerName) : p.providerName),
    }));
  }

  const showChecklist = isPatient && (!profileComplete || providerCount === 0 || pdaCount === 0 || !releaseCreated);

  return showChecklist ? (
    <OnboardingChecklist
      profileComplete={profileComplete}
      providerAdded={providerCount > 0}
      pdaAdded={pdaCount > 0}
      releaseCreated={releaseCreated}
    />
  ) : (
    <DashboardSummary
      firstName={user?.firstName ?? null}
      releaseCount={releaseCount}
      providerCount={providerCount}
      pdaCount={pdaCount}
      recordCount={recordCount}
      recentReleases={recentReleases}
    />
  );
}
