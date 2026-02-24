"use client";

import { Table, Badge, Anchor, Text, Paper, Button, Group } from "@mantine/core";
import Link from "next/link";

interface Agent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  address: string | null;
}

interface ScheduledCall {
  id: string;
  scheduledAt: string;
  status: 'scheduled' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  agent: Agent;
}

interface Props {
  calls: ScheduledCall[];
}

export default function ScheduledCallsTable({ calls }: Props) {
  if (calls.length === 0) {
    return <Text c="dimmed">No scheduled calls yet.</Text>;
  }

  return (
    <Paper withBorder>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Agent</Table.Th>
            <Table.Th>Date & Time</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {calls.map((call) => {
            const agentName =
              call.agent.firstName || call.agent.lastName
                ? `${call.agent.firstName ?? ""} ${call.agent.lastName ?? ""}`.trim()
                : call.agent.email;

            return (
              <Table.Tr key={call.id}>
                <Table.Td>{agentName}</Table.Td>
                <Table.Td>
                  {new Date(call.scheduledAt).toLocaleString()}
                </Table.Td>
                <Table.Td>
                  <Badge color={call.status === 'scheduled' ? 'green' : 'gray'}>
                    {call.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Anchor component={Link} href={`/scheduled-calls/${call.id}`} size="sm">
                      View
                    </Anchor>
                    {call.status === 'scheduled' && (
                      <Button
                        component={Link}
                        href={`/scheduled-calls/${call.id}/reschedule`}
                        size="xs"
                        variant="light"
                      >
                        Reschedule
                      </Button>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
