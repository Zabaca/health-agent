"use client";

import { useState } from "react";
import {
  Modal, Button, TextInput, Stack, Group, Text,
  CopyButton, Tooltip, ActionIcon, Alert, Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCheck, IconCopy, IconUserPlus, IconShieldCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface CreatedAgent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  plainPassword: string;
}

export default function CreateAgentModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedAgent | null>(null);
  const router = useRouter();

  function handleClose() {
    if (created) router.refresh();
    close();
    setTimeout(() => {
      setFirstName("");
      setLastName("");
      setEmail("");
      setError(null);
      setCreated(null);
    }, 300);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    setCreated(data);
  }

  return (
    <>
      <Button leftSection={<IconUserPlus size={16} />} onClick={open}>
        Create Agent
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title={created ? "Agent Created" : "Create Agent"}
        centered
      >
        {!created ? (
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
              <Group justify="flex-end" mt="xs">
                <Button variant="subtle" onClick={close}>Cancel</Button>
                <Button type="submit" loading={loading}>Create Agent</Button>
              </Group>
            </Stack>
          </form>
        ) : (
          <Stack>
            <Alert color="teal" variant="light" icon={<IconShieldCheck size={16} />}>
              Agent account created. Share the temporary password below — the agent must change it on first login.
            </Alert>

            <Group grow>
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={500}>Name</Text>
                <Text size="sm">{created.firstName} {created.lastName}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={500}>Email</Text>
                <Text size="sm">{created.email}</Text>
              </Stack>
            </Group>

            <Divider />

            <Stack gap="xs">
              <Text size="xs" c="dimmed" fw={500}>Temporary Password</Text>
              <Group gap="xs" align="center">
                <Text
                  size="sm"
                  ff="monospace"
                  fw={600}
                  style={{
                    flex: 1,
                    background: "var(--mantine-color-default)",
                    border: "1px solid var(--mantine-color-default-border)",
                    borderRadius: "var(--mantine-radius-sm)",
                    padding: "8px 12px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {created.plainPassword}
                </Text>
                <CopyButton value={created.plainPassword} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied!" : "Copy to clipboard"} withArrow>
                      <ActionIcon
                        color={copied ? "teal" : "gray"}
                        variant="subtle"
                        size="lg"
                        onClick={copy}
                        aria-label="Copy password"
                      >
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Stack>

            <Group justify="flex-end" mt="xs">
              <Button onClick={handleClose}>Done</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
