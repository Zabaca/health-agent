"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Button,
  Group,
  Text,
  Modal,
  ActionIcon,
  Tooltip,
  Badge,
} from "@mantine/core";
import { IconEye, IconBan } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import type { ReleaseSummary } from "@/types/release";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";

interface Props {
  releases: ReleaseSummary[];
}

export default function ReleaseList({ releases }: Props) {
  const router = useRouter();
  const [voidId, setVoidId] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);

  const handleVoid = async () => {
    if (!voidId) return;
    setVoiding(true);

    try {
      const result = await apiClient.releases.void({ params: { id: voidId } });

      if (result.status !== 200) {
        notifications.show({
          title: "Error",
          message: "Failed to void release",
          color: "red",
        });
        return;
      }

      notifications.show({
        title: "Voided",
        message: "Release has been voided",
        color: "orange",
      });

      setVoidId(null);
      router.refresh();
    } catch {
      notifications.show({
        title: "Error",
        message: "Unexpected error. Please try again.",
        color: "red",
      });
    } finally {
      setVoiding(false);
    }
  };

  if (releases.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No releases yet.{" "}
        <Link href="/releases/new" style={{ color: "inherit" }}>
          Create your first release
        </Link>
        .
      </Text>
    );
  }

  const rows = releases.map((r) => (
    <Table.Tr key={r.id}>
      <Table.Td>
        {r.firstName} {r.lastName}
      </Table.Td>
      <Table.Td>
        {r.providerNames.length > 0 ? (
          <Text size="sm">{r.providerNames.join(", ")}</Text>
        ) : (
          <Text size="sm" c="dimmed">—</Text>
        )}
      </Table.Td>
      <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
      <Table.Td>{new Date(r.updatedAt).toLocaleString()}</Table.Td>
      <Table.Td>
        {!r.authSignatureImage ? (
          <Badge color="yellow" variant="light">Signature Required</Badge>
        ) : (
          <Badge color="green" variant="light">Signed</Badge>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="View">
            <ActionIcon
              component={Link}
              href={`/releases/${r.id}`}
              variant="light"
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Void">
            <ActionIcon
              variant="light"
              color="orange"
              onClick={() => setVoidId(r.id)}
            >
              <IconBan size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Patient Name</Table.Th>
            <Table.Th>Providers</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Last Updated</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Modal
        opened={!!voidId}
        onClose={() => setVoidId(null)}
        title="Void Release"
        centered
      >
        <Text mb="xs">
          Are you sure you want to void this release form?
        </Text>
        <Text mb="lg" c="dimmed" size="sm">
          This action cannot be undone. If you need to submit a new request, you will need to create a new release form.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setVoidId(null)}>
            Cancel
          </Button>
          <Button color="orange" loading={voiding} onClick={handleVoid}>
            Void
          </Button>
        </Group>
      </Modal>
    </>
  );
}
