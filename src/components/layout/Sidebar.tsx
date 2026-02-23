"use client";

import { NavLink, Stack, Button } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { NavItem } from "./AppShell";

interface Props {
  onNavLinkClick?: () => void;
  navItems: NavItem[];
}

export default function Sidebar({ onNavLinkClick, navItems }: Props) {
  const pathname = usePathname();

  return (
    <Stack h="100%" justify="space-between" p="md">
      <Stack gap={4}>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            component={Link}
            href={item.href}
            label={item.label}
            leftSection={item.icon}
            active={pathname === item.href}
            onClick={onNavLinkClick}
          />
        ))}
      </Stack>
      <Button
        variant="subtle"
        color="gray"
        leftSection={<IconLogout size={16} />}
        onClick={() => signOut({ callbackUrl: "/login" })}
        fullWidth
      >
        Sign Out
      </Button>
    </Stack>
  );
}
