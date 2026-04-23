'use client';

import { Paper, Stack, Group, Text, Title, SimpleGrid, Badge, ThemeIcon, Anchor } from '@mantine/core';
import { IconFiles, IconBuildingHospital, IconUsers, IconFolder, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

interface RecentRelease {
  id: string;
  providerNames: string[];
  signed: boolean;
  voided: boolean;
  createdAt: string;
}

interface Props {
  firstName: string | null;
  releaseCount: number;
  providerCount: number;
  pdaCount: number;
  recordCount: number;
  recentReleases: RecentRelease[];
}

function StatCard({ icon, count, label, href }: { icon: React.ReactNode; count: number; label: string; href: string }) {
  return (
    <Paper
      withBorder
      p="lg"
      radius="md"
      component={Link}
      href={href}
      style={{ textDecoration: 'none' }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Text size="2rem" fw={700} lh={1}>{count}</Text>
          <Text size="sm" c="dimmed">{label}</Text>
        </Stack>
        <ThemeIcon size={40} radius="md" variant="light" color="blue" style={{ flexShrink: 0 }}>
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

export default function DashboardSummary({ firstName, releaseCount, providerCount, pdaCount, recordCount, recentReleases }: Props) {
  return (
    <Stack gap="xl">
      <Stack gap={2}>
        <Title order={3}>Welcome back{firstName ? `, ${firstName}` : ''}!</Title>
        <Text c="dimmed" size="sm">Here's an overview of your health record activity.</Text>
      </Stack>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <StatCard icon={<IconFiles size={20} />} count={releaseCount} label="Releases" href="/releases" />
        <StatCard icon={<IconBuildingHospital size={20} />} count={providerCount} label="Providers" href="/my-providers" />
        <StatCard icon={<IconUsers size={20} />} count={pdaCount} label="Designated Agents" href="/my-designated-agents" />
        <StatCard icon={<IconFolder size={20} />} count={recordCount} label="Health Records" href="/my-records" />
      </SimpleGrid>

      {recentReleases.length > 0 && (
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={5}>Recent Releases</Title>
            <Anchor component={Link} href="/releases" size="sm" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              View all <IconChevronRight size={14} />
            </Anchor>
          </Group>
          <Stack gap="xs">
            {recentReleases.map((r) => (
              <Paper
                key={r.id}
                withBorder
                p="sm"
                radius="md"
                component={Link}
                href={`/releases/${r.id}`}
                style={{ textDecoration: 'none' }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate>
                      {r.providerNames.length > 0 ? r.providerNames.join(', ') : '—'}
                    </Text>
                    <Text size="xs" c="dimmed">{new Date(r.createdAt).toLocaleDateString()}</Text>
                  </Stack>
                  {r.voided ? (
                    <Badge color="gray" variant="light" size="sm" style={{ flexShrink: 0 }}>Voided</Badge>
                  ) : r.signed ? (
                    <Badge color="green" variant="light" size="sm" style={{ flexShrink: 0 }}>Signed</Badge>
                  ) : (
                    <Badge color="yellow" variant="light" size="sm" style={{ flexShrink: 0 }}>Signature Required</Badge>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
