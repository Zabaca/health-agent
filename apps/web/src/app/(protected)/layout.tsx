import { requirePageSession } from "@/lib/page-auth";
import { db } from "@/lib/db";
import { patientDesignatedAgents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { IconLayoutDashboard, IconFiles, IconUser, IconBuildingHospital, IconFolder, IconUsers, IconArrowsLeftRight } from "@tabler/icons-react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageSession();
  const userId = session.user.id;

  // Re-query from DB instead of trusting the stale JWT flag — isPda can become
  // true after sign-in when the user accepts a PDA invite without re-logging in.
  const pdaRelation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, userId),
      eq(patientDesignatedAgents.status, "accepted"),
    ),
    columns: { id: true },
  });
  const isPda = !!pdaRelation;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <IconLayoutDashboard size={16} /> },
    { href: "/profile", label: "My Profile", icon: <IconUser size={16} /> },
    { href: "/my-providers", label: "My Providers", icon: <IconBuildingHospital size={16} /> },
    { href: "/releases", label: "Releases", icon: <IconFiles size={16} /> },
    { href: "/my-records", label: "My Records", icon: <IconFolder size={16} /> },
    { href: "/my-designated-agents", label: "My Designated Agents", icon: <IconUsers size={16} /> },
  ];

  const bottomNavItems = isPda
    ? [{ href: "/representing", label: "Representative View", icon: <IconArrowsLeftRight size={16} /> }]
    : [];

  return <AppShell navItems={navItems} bottomNavItems={bottomNavItems}>{children}</AppShell>;
}
