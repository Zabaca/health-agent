import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import { IconUsers, IconUser, IconCalendar } from "@tabler/icons-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.type !== 'admin') {
    redirect("/dashboard");
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: <IconUsers size={16} /> },
    { href: "/admin/call-schedule", label: "Call Schedule", icon: <IconCalendar size={16} /> },
  ];

  const bottomNavItems = [
    { href: "/admin/profile", label: "My Profile", icon: <IconUser size={16} /> },
  ];

  return (
    <AppShell navItems={navItems} bottomNavItems={bottomNavItems} primaryColor="teal" title="Admin Portal">
      {children}
    </AppShell>
  );
}
