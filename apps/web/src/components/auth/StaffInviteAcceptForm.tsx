"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Paper, Title, Text, Stack, TextInput, PasswordInput,
  Button, Alert, Badge, Group, Avatar, ActionIcon, Box, Loader, Center,
} from "@mantine/core";
import { IconCamera } from "@tabler/icons-react";

interface StaffInviteAcceptFormProps {
  token: string;
  invite: {
    id: string;
    email: string;
    role: "admin" | "agent";
    firstName: string;
    lastName: string;
  };
}

function getInitials(first: string, last: string): string {
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

export default function StaffInviteAcceptForm({ token, invite }: StaffInviteAcceptFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(invite.firstName);
  const [lastName, setLastName] = useState(invite.lastName);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!address.trim()) {
      setError("Address is required.");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("firstName", firstName.trim());
    formData.append("lastName", lastName.trim());
    formData.append("address", address.trim());
    formData.append("phoneNumber", phoneNumber.trim());
    formData.append("password", password);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const res = await fetch(`/api/staff-invite/${token}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/login?invited=1");
  }

  const roleLabel = invite.role === "admin" ? "Admin" : "Agent";
  const roleColor = invite.role === "admin" ? "teal" : "violet";

  return (
    <Center style={{ minHeight: "100vh", padding: "24px 16px" }}>
      <Paper p="xl" radius="md" withBorder style={{ maxWidth: 520, width: "100%" }}>
        <Stack gap="lg">
          <Stack gap={4}>
            <Group gap="xs" align="center">
              <Title order={3}>Set Up Your Account</Title>
              <Badge color={roleColor} variant="light">{roleLabel}</Badge>
            </Group>
            <Text c="dimmed" size="sm">
              You&apos;ve been invited to join Zabaca as a {roleLabel}. Complete your profile to get started.
            </Text>
          </Stack>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {error && <Alert color="red" variant="light">{error}</Alert>}

              {/* Avatar */}
              <Stack gap={4}>
                <Text size="sm" fw={500}>Profile Photo <Text span c="dimmed" size="xs">(optional)</Text></Text>
                <Group gap="sm" align="center">
                  <Box style={{ position: "relative", width: 72, height: 72 }}>
                    <Avatar
                      src={avatarPreview}
                      size={72}
                      radius="50%"
                      style={{ cursor: "pointer" }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {getInitials(firstName, lastName)}
                    </Avatar>
                    <ActionIcon
                      size="sm"
                      radius="50%"
                      variant="filled"
                      color="gray"
                      style={{ position: "absolute", bottom: 0, right: 0 }}
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Upload photo"
                      type="button"
                    >
                      <IconCamera size={12} />
                    </ActionIcon>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleAvatarChange}
                    />
                  </Box>
                  <Text size="xs" c="dimmed">Click to upload a profile photo</Text>
                </Group>
              </Stack>

              {/* Email (read-only) */}
              <TextInput
                label="Email"
                value={invite.email}
                readOnly
                styles={{ input: { background: "var(--mantine-color-default-hover)" } }}
              />

              <Group grow>
                <TextInput
                  label="First Name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <TextInput
                  label="Last Name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Group>

              <TextInput
                label="Address"
                required
                placeholder="123 Main St, City, State, ZIP"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <TextInput
                label="Phone Number"
                required
                placeholder="(555) 000-0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />

              <PasswordInput
                label="Password"
                required
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <PasswordInput
                label="Confirm Password"
                required
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <Button type="submit" loading={loading} fullWidth mt="xs">
                Create Account
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Center>
  );
}
