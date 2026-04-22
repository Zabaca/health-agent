import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { IconLayoutDashboard, IconFiles, IconUser, IconBuildingHospital, IconPhone, IconFolder, IconUsers, IconArrowsLeftRight } from "@tabler/icons-react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const user = await db.select({ disabled: users.disabled }).from(users).where(eq(users.id, session.user.id)).get();
  if (user?.disabled) {
    redirect("/suspended");
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <IconLayoutDashboard size={16} /> },
    { href: "/profile", label: "My Profile", icon: <IconUser size={16} /> },
    { href: "/my-providers", label: "My Providers", icon: <IconBuildingHospital size={16} /> },
    { href: "/scheduled-calls", label: "Scheduled Calls", icon: <IconPhone size={16} /> },
    { href: "/releases", label: "Releases", icon: <IconFiles size={16} /> },
    { href: "/my-records", label: "My Records", icon: <IconFolder size={16} /> },
    { href: "/my-designated-agents", label: "My Designated Agents", icon: <IconUsers size={16} /> },
  ];

  // Only show switcher for users who are both a patient AND have PDA relationships
  const bottomNavItems = (session.user.isPda && session.user.isPatient)
    ? [{ href: "/representing", label: "Representative View", icon: <IconArrowsLeftRight size={16} /> }]
    : [];

  return <AppShell navItems={navItems} bottomNavItems={bottomNavItems}>{children}</AppShell>;
}
