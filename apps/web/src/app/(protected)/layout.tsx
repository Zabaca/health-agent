import { requirePageSession } from "@/lib/page-auth";
import { isPdaExempt } from "@/lib/consent-gate";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import ConsentModal from "@/components/consent/ConsentModal";
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
  // Shared with POST /api/consent so the gate and its enforcement can't drift.
  const isPda = await isPdaExempt(userId);

  // Consent gate: blocks the portal until legal acceptance is recorded. PDAs are
  // exempt (the inviting adult's invitation is proof of consent). Re-query the
  // current row so a just-recorded consent isn't masked by a stale JWT.
  const consentRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { consentedAt: true, dateOfBirth: true },
  });
  const needsConsent = !isPda && !consentRow?.consentedAt;

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

  return (
    <AppShell navItems={navItems} bottomNavItems={bottomNavItems}>
      {/* Render the gate INSTEAD of children — a sibling overlay would still
          stream the protected server components (and their PHI) to the browser
          underneath the modal. */}
      {needsConsent ? (
        <ConsentModal hasDateOfBirth={!!consentRow?.dateOfBirth} />
      ) : (
        children
      )}
    </AppShell>
  );
}
