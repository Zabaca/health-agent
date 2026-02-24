"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Paper, Title, Select, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { apiClient } from "@/lib/api/client";

interface StaffMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  type: "admin" | "agent";
}

interface Props {
  mode: "admin" | "agent";
  patientId: string;
  staffMembers: StaffMember[];
  currentAssignedToId: string | null;
}

function staffLabel(s: StaffMember): string {
  const name = [s.firstName, s.lastName].filter(Boolean).join(" ");
  return name ? `${name} (${s.type})` : `${s.email} (${s.type})`;
}

export default function ReassignPatientControl({ mode, patientId, staffMembers, currentAssignedToId }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(currentAssignedToId);
  const [loading, setLoading] = useState(false);

  const options = staffMembers.map((s) => ({ value: s.id, label: staffLabel(s) }));

  const handleReassign = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const result = mode === "admin"
        ? await apiClient.admin.patients.reassign({ params: { id: patientId }, body: { assignedToId: selectedId } })
        : await apiClient.agent.patients.reassign({ params: { id: patientId }, body: { assignedToId: selectedId } });

      if (result.status !== 200) {
        notifications.show({ title: "Error", message: "Failed to reassign patient", color: "red" });
        return;
      }
      notifications.show({ title: "Reassigned", message: "Patient has been reassigned", color: "green" });
      router.refresh();
    } catch {
      notifications.show({ title: "Error", message: "Unexpected error. Please try again.", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper withBorder p="lg" radius="md">
      <Title order={4} mb="md">Assigned To</Title>
      <Group align="flex-end">
        <Select
          placeholder="Select agent or admin"
          data={options}
          value={selectedId}
          onChange={setSelectedId}
          searchable
          style={{ flex: 1 }}
        />
        <Button
          onClick={handleReassign}
          loading={loading}
          disabled={!selectedId || selectedId === currentAssignedToId}
        >
          Reassign
        </Button>
      </Group>
    </Paper>
  );
}
