'use client';

import React from 'react';
import { Paper, Stack, Group, Text, Button, ThemeIcon, Tooltip, Title, Divider, Badge } from '@mantine/core';
import { IconCheck, IconUser, IconBuilding, IconUsers, IconFileDescription } from '@tabler/icons-react';
import Link from 'next/link';

interface Props {
  profileComplete: boolean;
  providerAdded: boolean;
  pdaAdded: boolean;
  releaseCreated: boolean;
}

interface ChecklistItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  done: boolean;
  href: string;
  action: string;
  disabled?: boolean;
  disabledReason?: string;
}

export default function OnboardingChecklist({ profileComplete, providerAdded, pdaAdded, releaseCreated }: Props) {
  const releasePrereqsMet = profileComplete && providerAdded;
  const invitePrereqsMet = profileComplete && providerAdded;

  const items: ChecklistItem[] = [
    {
      icon: <IconUser size={20} />,
      label: 'Add personal information',
      description: 'Your name, date of birth, and contact details are required to create accurate medical record releases.',
      done: profileComplete,
      href: '/profile?redirect=/dashboard',
      action: 'Add',
    },
    {
      icon: <IconBuilding size={20} />,
      label: 'Add a provider',
      description: 'Add the healthcare providers — clinics, hospitals, or insurance companies — you want to request records from.',
      done: providerAdded,
      href: '/my-providers?redirect=/dashboard',
      action: 'Add',
    },
    {
      icon: <IconUsers size={20} />,
      label: 'Invite someone to help manage your records',
      description: 'Authorize a trusted person such as a family member or caregiver to manage your health records on your behalf.',
      done: pdaAdded,
      href: '/my-designated-agents?redirect=/dashboard',
      action: 'Invite',
      disabled: !invitePrereqsMet,
      disabledReason: 'Complete your personal information and add a provider first',
    },
    {
      icon: <IconFileDescription size={20} />,
      label: 'Create a release',
      description: 'Submit a HIPAA-compliant authorization to request your medical records from your providers.',
      done: releaseCreated,
      href: '/releases/new?redirect=/dashboard',
      action: 'Create',
      disabled: !releasePrereqsMet,
      disabledReason: 'Complete your personal information and add a provider first',
    },
  ];

  const completedCount = items.filter((item) => item.done).length;

  return (
    <Paper withBorder radius="md" mb="xl" style={{ overflow: 'hidden' }}>
      <Group justify="space-between" align="flex-start" p="lg" pb="md">
        <Stack gap={2}>
          <Title order={4}>Get Started</Title>
          <Text size="sm" c="dimmed">
            Complete these steps to get the most out of your health portal.
          </Text>
        </Stack>
        <Badge
          variant="light"
          color={completedCount === items.length ? 'green' : 'blue'}
          size="lg"
        >
          {completedCount} / {items.length} complete
        </Badge>
      </Group>
      <Divider />
      <Stack gap={0}>
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 && <Divider />}
            <Group
              justify="space-between"
              wrap="nowrap"
              p="md"
              style={{ opacity: item.done ? 0.6 : 1 }}
            >
              <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <ThemeIcon size={44} radius="md" color={item.done ? 'green' : 'blue'} variant="light" style={{ flexShrink: 0 }}>
                  {item.done ? <IconCheck size={22} /> : item.icon}
                </ThemeIcon>
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text fw={600} size="sm">{item.label}</Text>
                  <Text size="xs" c="dimmed">{item.description}</Text>
                </Stack>
              </Group>
              <div style={{ flexShrink: 0, paddingLeft: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                {item.done ? (
                  <Badge color="green" variant="light" size="sm" w={90} ta="center">Done</Badge>
                ) : item.disabled ? (
                  <Tooltip label={item.disabledReason} withArrow position="left">
                    <span style={{ display: 'inline-block', width: 90 }}>
                      <Button size="xs" w="100%" disabled>{item.action}</Button>
                    </span>
                  </Tooltip>
                ) : (
                  <Button size="xs" w={90} component={Link} href={item.href}>{item.action}</Button>
                )}
              </div>
            </Group>
          </React.Fragment>
        ))}
      </Stack>
    </Paper>
  );
}
