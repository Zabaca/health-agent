import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { IconUsers, IconUser, IconCalendar, IconUserCog, IconSearch } from "@tabler/icons-react";

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

  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id), columns: { disabled: true } });
  if (user?.disabled) {
    redirect("/suspended");
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: <IconUsers size={16} /> },
    { href: "/admin/agents", label: "Agents", icon: <IconUserCog size={16} /> },
    { href: "/admin/call-schedule", label: "Call Schedule", icon: <IconCalendar size={16} /> },
    { href: "/admin/releases/lookup", label: "Lookup Release", icon: <IconSearch size={16} /> },
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
