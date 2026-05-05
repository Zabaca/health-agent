"use client";

import Link from "next/link";
import { Paper, Group, Text, ThemeIcon } from "@mantine/core";
import { IconArrowsLeftRight } from "@tabler/icons-react";

interface Props {
  href: string;
  label: string;
}

export default function RoleSwitchSection({ href, label }: Props) {
  return (
    <Paper
      component={Link}
      href={href}
      p="md"
      radius="md"
      withBorder
      mt="md"
      style={{ display: "block", textDecoration: "none", cursor: "pointer" }}
    >
      <Group gap="sm">
        <ThemeIcon variant="light" color="blue" size="md" radius="sm">
          <IconArrowsLeftRight size={16} />
        </ThemeIcon>
        <Text fw={500} c="blue">
          {label}
        </Text>
      </Group>
    </Paper>
  );
}
