import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { IconUser, IconUsers } from "@tabler/icons-react";

export default async function PatientDesignatedAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Allow any authenticated user — middleware handles type-based routing
  const userId = session.user.id;

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
    return {
      href: `/representing/${r.patientId}`,
      label: patientName,
      icon: <IconUsers size={16} />,
    };
  });

  const bottomNavItems = [
    { href: "#", label: "My Account", icon: <IconUser size={16} /> },
  ];

  return (
    <AppShell
      navItems={navItems}
      bottomNavItems={bottomNavItems}
      primaryColor="teal"
      title="Representing"
    >
      {children}
    </AppShell>
  );
}
