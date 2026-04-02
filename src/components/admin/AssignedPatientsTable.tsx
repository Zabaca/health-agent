"use client";

import { Table, Anchor, Text } from "@mantine/core";
import Link from "next/link";

interface Patient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface Props {
  patients: Patient[];
  basePath: string;
}

export default function AssignedPatientsTable({ patients, basePath }: Props) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Email</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {patients.map((p) => {
          const patientName = [p.firstName, p.lastName].filter(Boolean).join(" ");
          return (
            <Table.Tr key={p.id}>
              <Table.Td>
                <Anchor component={Link} href={`${basePath}/${p.id}`} size="sm">
                  {patientName || <Text size="sm" c="dimmed">(no name)</Text>}
                </Anchor>
              </Table.Td>
              <Table.Td><Text size="sm">{p.email}</Text></Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
