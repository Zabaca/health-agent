"use client";

import { useState } from "react";
import {
  Modal, Button, TextInput, Stack, Group, Text, Alert, Select,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconUserPlus, IconMailCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function CreateAgentModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"agent" | "admin">("agent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const router = useRouter();

  function handleClose() {
    if (sentEmail) router.refresh();
    close();
    setTimeout(() => {
      setFirstName("");
      setLastName("");
      setEmail("");
      setRole("agent");
      setError(null);
      setSentEmail(null);
    }, 300);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/staff-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    setSentEmail(email);
  }

  return (
    <>
      <Button leftSection={<IconUserPlus size={16} />} onClick={open}>
        Invite Staff
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title={sentEmail ? "Invitation Sent" : "Invite Staff Member"}
        centered
      >
        {!sentEmail ? (
          <form onSubmit={handleSubmit}>
            <Stack>
              {error && <Alert color="red" variant="light">{error}</Alert>}
              <Group grow>
                <TextInput
                  label="First Name"
                  placeholder="Jane"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <TextInput
                  label="Last Name"
                  placeholder="Smith"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Group>
              <TextInput
                label="Email"
                type="email"
                placeholder="jane@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Select
                label="Role"
                required
                value={role}
                onChange={(v) => setRole((v as "agent" | "admin") ?? "agent")}
                data={[
                  { value: "agent", label: "Agent" },
                  { value: "admin", label: "Admin" },
                ]}
              />
              <Group justify="flex-end" mt="xs">
                <Button variant="subtle" onClick={close}>Cancel</Button>
                <Button type="submit" loading={loading}>Send Invite</Button>
              </Group>
            </Stack>
          </form>
        ) : (
          <Stack>
            <Alert color="teal" variant="light" icon={<IconMailCheck size={16} />}>
              Invitation sent to <strong>{sentEmail}</strong>. They will receive an email with a link to set up their account.
            </Alert>
            <Text size="sm" c="dimmed">
              The invite link expires in 48 hours. You can resend it from the Pending Invites section if needed.
            </Text>
            <Group justify="flex-end" mt="xs">
              <Button onClick={handleClose}>Done</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
