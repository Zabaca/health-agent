"use client";

import { NavLink, Stack, Button } from "@mantine/core";
import { IconLayoutDashboard, IconPlus, IconLogout, IconUser, IconBuildingHospital } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface Props {
  onNavLinkClick?: () => void;
}

export default function Sidebar({ onNavLinkClick }: Props) {
  const pathname = usePathname();

  return (
    <Stack h="100%" justify="space-between" p="md">
      <Stack gap={4}>
        <NavLink
          component={Link}
          href="/dashboard"
          label="Dashboard"
          leftSection={<IconLayoutDashboard size={16} />}
          active={pathname === "/dashboard"}
          onClick={onNavLinkClick}
        />
        <NavLink
          component={Link}
          href="/profile"
          label="My Profile"
          leftSection={<IconUser size={16} />}
          active={pathname === "/profile"}
          onClick={onNavLinkClick}
        />
        <NavLink
          component={Link}
          href="/my-providers"
          label="My Providers"
          leftSection={<IconBuildingHospital size={16} />}
          active={pathname === "/my-providers"}
          onClick={onNavLinkClick}
        />
        <NavLink
          component={Link}
          href="/releases/new"
          label="New Release"
          leftSection={<IconPlus size={16} />}
          active={pathname === "/releases/new"}
          onClick={onNavLinkClick}
        />
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
