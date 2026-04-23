'use client';

import React from 'react';
import { Paper, Stack, Group, Text, Button, ThemeIcon, Title, Divider } from '@mantine/core';
import { IconUser, IconBuilding } from '@tabler/icons-react';
import Link from 'next/link';

interface Props {
  profileComplete: boolean;
  providerAdded: boolean;
}

export default function ReleasePrerequisites({ profileComplete, providerAdded }: Props) {
  const items = [
    {
      icon: <IconUser size={20} />,
      label: 'Add personal information',
      description: 'Your name, date of birth, and contact details are required to create accurate medical record releases.',
      done: profileComplete,
      href: '/profile',
    },
    {
      icon: <IconBuilding size={20} />,
      label: 'Add a provider',
      description: 'Add the healthcare providers — clinics, hospitals, or insurance companies — you want to request records from.',
      done: providerAdded,
      href: '/my-providers',
    },
  ].filter((item) => !item.done);

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      <Stack gap={2} p="lg" pb="md">
        <Title order={4}>Before you can create a release</Title>
        <Text size="sm" c="dimmed">
          Complete the following steps before creating a release.
        </Text>
      </Stack>
      <Divider />
      <Stack gap={0}>
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 && <Divider />}
            <Group justify="space-between" wrap="nowrap" p="md">
              <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <ThemeIcon size={44} radius="md" color="blue" variant="light" style={{ flexShrink: 0 }}>
                  {item.icon}
                </ThemeIcon>
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text fw={600} size="sm">{item.label}</Text>
                  <Text size="xs" c="dimmed">{item.description}</Text>
                </Stack>
              </Group>
              <div style={{ flexShrink: 0, paddingLeft: '1rem' }}>
                <Button size="xs" w={90} component={Link} href={item.href}>Add</Button>
              </div>
            </Group>
          </React.Fragment>
        ))}
      </Stack>
    </Paper>
  );
}
