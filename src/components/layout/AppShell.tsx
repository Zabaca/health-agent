"use client";

import { AppShell as MantineAppShell, Burger, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <MantineAppShell
      navbar={{ width: 220, breakpoint: "sm", collapsed: { mobile: !opened } }}
      header={{ height: 60 }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text fw={700} size="lg" c="blue">Medical Records</Text>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar>
        <Sidebar onNavLinkClick={close} />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>{children}</MantineAppShell.Main>
    </MantineAppShell>
  );
}
