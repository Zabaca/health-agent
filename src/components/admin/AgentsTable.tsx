"use client";

import { Table, Badge, Text } from "@mantine/core";

interface Agent {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  mustChangePassword: boolean;
  createdAt: string;
}

export default function AgentsTable({ agents }: { agents: Agent[] }) {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Email</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Created</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {agents.map((agent) => (
          <Table.Tr key={agent.id}>
            <Table.Td>
              {[agent.firstName, agent.lastName].filter(Boolean).join(" ") || "—"}
            </Table.Td>
            <Table.Td>{agent.email}</Table.Td>
            <Table.Td>
              {agent.mustChangePassword ? (
                <Badge color="orange" variant="light">Password reset required</Badge>
              ) : (
                <Badge color="teal" variant="light">Active</Badge>
              )}
            </Table.Td>
            <Table.Td>
              <Text size="sm">{new Date(agent.createdAt).toLocaleDateString()}</Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
