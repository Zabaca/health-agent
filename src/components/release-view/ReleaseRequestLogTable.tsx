"use client";

import { Badge, Paper, Table, Text, Title } from "@mantine/core";
import type { ReleaseRequestLogRow } from "@/lib/db/types";

export default function ReleaseRequestLogTable({ logs }: { logs: ReleaseRequestLogRow[] }) {
  return (
    <Paper withBorder p="md" radius="md" className="no-print">
      <Title order={4} mb="md">Release Request History</Title>
      {logs.length === 0 ? (
        <Text size="sm" c="dimmed">No requests sent yet.</Text>
      ) : (
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Type</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Fax Number</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Response</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {logs.map((log) => (
              <Table.Tr key={log.id}>
                <Table.Td><Text tt="uppercase" size="xs">{log.type}</Text></Table.Td>
                <Table.Td>
                  <Badge color={log.error ? "red" : "green"} variant="light">
                    {log.error ? "error" : log.status}
                  </Badge>
                </Table.Td>
                <Table.Td><Text size="sm">{log.faxNumber ?? "—"}</Text></Table.Td>
                <Table.Td>
                  <Text size="sm">{new Date(log.createdAt).toLocaleString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" truncate maw={200}>
                    {log.apiResponse ?? "—"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}
