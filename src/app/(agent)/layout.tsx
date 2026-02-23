import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import { IconUsers, IconUser, IconCalendar } from "@tabler/icons-react";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.type !== 'agent') {
    redirect("/dashboard");
  }

  const navItems = [
    { href: "/agent/dashboard", label: "Dashboard", icon: <IconUsers size={16} /> },
    { href: "/agent/profile", label: "My Profile", icon: <IconUser size={16} /> },
    { href: "/agent/call-schedule", label: "Call Schedule", icon: <IconCalendar size={16} /> },
  ];

  return (
    <AppShell navItems={navItems} primaryColor="violet" title="Agent Portal">
      {children}
    </AppShell>
  );
}
