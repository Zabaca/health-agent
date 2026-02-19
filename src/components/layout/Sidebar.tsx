"use client";

import { NavLink, Stack, Text, Button } from "@mantine/core";
import { IconLayoutDashboard, IconPlus, IconLogout, IconUser, IconBuildingHospital } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Stack h="100%" justify="space-between" p="md">
      <Stack gap={4}>
        <Text fw={700} size="lg" mb="md" c="blue">
          Medical Records
        </Text>
        <NavLink
          component={Link}
          href="/dashboard"
          label="Dashboard"
          leftSection={<IconLayoutDashboard size={16} />}
          active={pathname === "/dashboard"}
        />
        <NavLink
          component={Link}
          href="/profile"
          label="My Profile"
          leftSection={<IconUser size={16} />}
          active={pathname === "/profile"}
        />
        <NavLink
          component={Link}
          href="/my-providers"
          label="My Providers"
          leftSection={<IconBuildingHospital size={16} />}
          active={pathname === "/my-providers"}
        />
        <NavLink
          component={Link}
          href="/releases/new"
          label="New Release"
          leftSection={<IconPlus size={16} />}
          active={pathname === "/releases/new"}
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
