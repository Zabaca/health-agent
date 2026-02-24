"use client";

import { AppShell as MantineAppShell, Burger, Group, Text, MantineProvider, createTheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Sidebar from "./Sidebar";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  children: React.ReactNode;
  title?: string;
  primaryColor?: string;
  navItems: NavItem[];
  bottomNavItems?: NavItem[];
}

export default function AppShell({ children, title = "Medical Records", primaryColor = "blue", navItems, bottomNavItems }: Props) {
  const [opened, { toggle, close }] = useDisclosure();
  const theme = createTheme({ primaryColor: primaryColor as any });

  return (
    <MantineProvider theme={theme}>
      <MantineAppShell
        navbar={{ width: 220, breakpoint: "sm", collapsed: { mobile: !opened } }}
        header={{ height: 60 }}
        padding="md"
      >
        <MantineAppShell.Header>
          <Group h="100%" px="md" gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg" c={primaryColor}>{title}</Text>
          </Group>
        </MantineAppShell.Header>

        <MantineAppShell.Navbar>
          <Sidebar onNavLinkClick={close} navItems={navItems} bottomNavItems={bottomNavItems} />
        </MantineAppShell.Navbar>

        <MantineAppShell.Main>{children}</MantineAppShell.Main>
      </MantineAppShell>
    </MantineProvider>
  );
}
