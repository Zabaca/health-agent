import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { patientDesignatedAgents, patientAssignments, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { IconUser, IconUsers, IconFileText, IconBuildingHospital, IconFolder, IconArrowsLeftRight } from "@tabler/icons-react";
import PdaOnboardingModal from "@/components/designated-agents/PdaOnboardingModal";
import RevokedAccessModal from "@/components/designated-agents/RevokedAccessModal";
import { requirePageSession } from "@/lib/page-auth";

export default async function PatientDesignatedAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageSession();
  const userId = session.user.id;
  const isOnboarded = session.user.onboarded;

  const currentUser = isOnboarded ? null : await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { firstName: true, lastName: true },
  });

  const [relations, patientAssignment] = await Promise.all([
    db.query.patientDesignatedAgents.findMany({
      where: and(
        eq(patientDesignatedAgents.agentUserId, userId),
        eq(patientDesignatedAgents.status, "accepted"),
      ),
      with: { patient: true },
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    }),
    // Re-query from DB — isPatient in the JWT can be stale if the user was
    // assigned as a patient after their current session was minted.
    db.query.patientAssignments.findFirst({
      where: eq(patientAssignments.patientId, userId),
      columns: { id: true },
    }),
  ]);
  const isPatient = !!patientAssignment;

  // Access was revoked (or all relations removed) and the user has already
  // completed PDA onboarding — they shouldn't be stuck here.
  // Patients auto-redirect to their own dashboard; PDA-only users see a
  // sign-out prompt (can't server-redirect them without a destination).
  if (isOnboarded && relations.length === 0) {
    if (isPatient) redirect("/dashboard");
  }

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
      {isOnboarded && relations.length === 0 && (
        <RevokedAccessModal isPatient={isPatient} />
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
