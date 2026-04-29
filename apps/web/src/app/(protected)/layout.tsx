import { requirePageSession } from "@/lib/page-auth";
import AppShell from "@/components/layout/AppShell";
import { IconLayoutDashboard, IconFiles, IconUser, IconBuildingHospital, IconFolder, IconUsers, IconArrowsLeftRight } from "@tabler/icons-react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageSession();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <IconLayoutDashboard size={16} /> },
    { href: "/profile", label: "My Profile", icon: <IconUser size={16} /> },
    { href: "/my-providers", label: "My Providers", icon: <IconBuildingHospital size={16} /> },
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
