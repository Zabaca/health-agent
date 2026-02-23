import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import { IconLayoutDashboard, IconPlus, IconUser, IconBuildingHospital } from "@tabler/icons-react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <IconLayoutDashboard size={16} /> },
    { href: "/profile", label: "My Profile", icon: <IconUser size={16} /> },
    { href: "/my-providers", label: "My Providers", icon: <IconBuildingHospital size={16} /> },
    { href: "/releases/new", label: "New Release", icon: <IconPlus size={16} /> },
  ];

  return <AppShell navItems={navItems}>{children}</AppShell>;
}
