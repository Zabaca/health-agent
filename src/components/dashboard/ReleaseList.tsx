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
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import type { ReleaseSummary } from "@/types/release";
import Link from "next/link";

interface Props {
  releases: ReleaseSummary[];
}

export default function ReleaseList({ releases }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/releases/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        notifications.show({
          title: "Error",
          message: "Failed to delete release",
          color: "red",
        });
        return;
      }

      notifications.show({
        title: "Deleted",
        message: "Release deleted successfully",
        color: "green",
      });

      setDeleteId(null);
      router.refresh();
    } catch {
      notifications.show({
        title: "Error",
        message: "Unexpected error. Please try again.",
        color: "red",
      });
    } finally {
      setDeleting(false);
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
      <Table.Td>{new Date(r.createdAt).toLocaleDateString()}</Table.Td>
      <Table.Td>{new Date(r.updatedAt).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Edit">
            <ActionIcon
              component={Link}
              href={`/releases/${r.id}`}
              variant="light"
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon
              variant="light"
              color="red"
              onClick={() => setDeleteId(r.id)}
            >
              <IconTrash size={16} />
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
            <Table.Th>Created</Table.Th>
            <Table.Th>Last Updated</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Modal
        opened={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Deletion"
        centered
      >
        <Text mb="lg">
          Are you sure you want to delete this release? This action cannot be
          undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button color="red" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}
