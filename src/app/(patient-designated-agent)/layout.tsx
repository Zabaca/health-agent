import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { IconUser, IconUsers, IconFileText, IconBuildingHospital, IconFolder, IconArrowsLeftRight } from "@tabler/icons-react";
import PdaOnboardingModal from "@/components/designated-agents/PdaOnboardingModal";
import RevokedAccessModal from "@/components/designated-agents/RevokedAccessModal";

export default async function PatientDesignatedAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Allow any authenticated user — middleware handles type-based routing
  const userId = session.user.id;
  const isOnboarded = session.user.onboarded;

  const currentUser = isOnboarded ? null : await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { firstName: true, lastName: true },
  });

  const relations = await db.query.patientDesignatedAgents.findMany({
    where: and(
      eq(patientDesignatedAgents.agentUserId, userId),
      eq(patientDesignatedAgents.status, 'accepted'),
    ),
    with: { patient: true },
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });

  const navItems = relations.map(r => {
    const patientName =
      [r.patient?.firstName, r.patient?.lastName].filter(Boolean).join(' ') ||
      r.patient?.email ||
      'Patient';
    const children = [];
    if (r.manageProvidersPermission) {
      children.push({ href: `/representing/${r.patientId}/providers`, label: 'Providers', icon: <IconBuildingHospital size={16} /> });
    }
    if (r.releasePermission) {
      children.push({ href: `/representing/${r.patientId}/releases`, label: 'HIPAA Releases', icon: <IconFileText size={16} /> });
    }
    if (r.healthRecordsPermission) {
      children.push({ href: `/representing/${r.patientId}/records`, label: 'Health Records', icon: <IconFolder size={16} /> });
    }
    return {
      href: `/representing/${r.patientId}`,
      label: patientName,
      icon: <IconUsers size={16} />,
      children,
    };
  });

  const isPatient = session.user.isPatient;

  const bottomNavItems = [
    { href: "/account", label: "My Account", icon: <IconUser size={16} /> },
    ...(isPatient
      ? [{ href: "/dashboard", label: "Patient View", icon: <IconArrowsLeftRight size={16} /> }]
      : []),
  ];

  return (
    <AppShell
      navItems={navItems}
      bottomNavItems={bottomNavItems}
      primaryColor="teal"
      title="Representing"
    >
      {session.user.isPda && relations.length === 0 && (
        <RevokedAccessModal isPatient={!!session.user.isPatient} />
      )}
      {!isOnboarded && (
        <PdaOnboardingModal
          firstName={currentUser?.firstName ?? null}
          lastName={currentUser?.lastName ?? null}
        />
      )}
      {children}
    </AppShell>
  );
}
