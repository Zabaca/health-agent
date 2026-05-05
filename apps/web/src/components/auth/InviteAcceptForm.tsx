"use client";

import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Alert,
  Stack,
  Center,
  Tabs,
  Badge,
  Group,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;

interface InviteInfo {
  inviteId: string;
  inviteeEmail: string;
  patientName: string;
  relationship: string | null;
}

interface CurrentUser {
  email: string | null;
}

export default function InviteAcceptForm({
  token,
  invite,
  currentUser,
}: {
  token: string;
  invite: InviteInfo;
  currentUser?: CurrentUser | null;
}) {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("register");

  const isSignedInAsInvitee =
    currentUser?.email?.toLowerCase() === invite.inviteeEmail.toLowerCase();

  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });
  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const acceptInvite = async (action: 'register' | 'login', extra?: object) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`/api/invites/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error || "Failed to accept invite");
        return false;
      }
      return true;
    } catch {
      setServerError("Unexpected error. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterData) => {
    const ok = await acceptInvite('register', {
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    if (!ok) return;
    await signIn("credentials", {
      email: invite.inviteeEmail,
      password: data.password,
      redirectTo: "/representing",
    });
  };

  const onLogin = async (data: LoginData) => {
    const result = await signIn("credentials", {
      email: invite.inviteeEmail,
      password: data.password,
      redirect: false,
    });
    if (result?.error) {
      setServerError("Invalid password");
      return;
    }
    const ok = await acceptInvite('login');
    if (!ok) return;
    window.location.href = "/representing";
  };

  const onAcceptAsCurrentUser = async () => {
    const ok = await acceptInvite('login');
    if (!ok) return;
    window.location.href = "/representing";
  };

  return (
    <Center mih="100vh">
      <Paper shadow="md" p={40} w={460} radius="md">
        <Title order={2} mb="xs" ta="center">
          You&apos;ve been invited
        </Title>
        <Text component="div" c="dimmed" size="sm" ta="center" mb="xs">
          <strong>{invite.patientName}</strong> has invited you to access their health records
          {invite.relationship && (
            <> as their <Badge size="sm" variant="light">{invite.relationship}</Badge></>
          )}
        </Text>
        <Text c="dimmed" size="xs" ta="center" mb="lg">
          {invite.inviteeEmail}
        </Text>

        {serverError && (
          <Alert color="red" mb="md">
            {serverError}
          </Alert>
        )}

        {isSignedInAsInvitee ? (
          <Stack>
            <Alert color="blue" variant="light">
              You&apos;re signed in as <strong>{currentUser?.email}</strong>.
            </Alert>
            <Button fullWidth loading={loading} onClick={onAcceptAsCurrentUser}>
              Accept invitation
            </Button>
          </Stack>
        ) : currentUser?.email ? (
          <Stack>
            <Alert color="orange" variant="light">
              You&apos;re signed in as <strong>{currentUser.email}</strong>, but this invite is for <strong>{invite.inviteeEmail}</strong>. Please sign in with the correct account to accept.
            </Alert>
          </Stack>
        ) : (
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List grow mb="md">
              <Tabs.Tab value="register">Create account</Tabs.Tab>
              <Tabs.Tab value="login">I have an account</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="register">
              <form onSubmit={registerForm.handleSubmit(onRegister)}>
                <Stack>
                  <TextInput
                    label="Email"
                    value={invite.inviteeEmail}
                    readOnly
                    disabled
                  />
                  <Group grow>
                    <TextInput
                      label="First name"
                      placeholder="Jane"
                      error={registerForm.formState.errors.firstName?.message}
                      {...registerForm.register("firstName")}
                    />
                    <TextInput
                      label="Last name"
                      placeholder="Doe"
                      error={registerForm.formState.errors.lastName?.message}
                      {...registerForm.register("lastName")}
                    />
                  </Group>
                  <PasswordInput
                    label="Password"
                    placeholder="Min 8 characters"
                    error={registerForm.formState.errors.password?.message}
                    {...registerForm.register("password")}
                  />
                  <PasswordInput
                    label="Confirm password"
                    placeholder="Repeat password"
                    error={registerForm.formState.errors.confirmPassword?.message}
                    {...registerForm.register("confirmPassword")}
                  />
                  <Button type="submit" fullWidth loading={loading} mt="sm">
                    Create account &amp; accept
                  </Button>
                </Stack>
              </form>
            </Tabs.Panel>

            <Tabs.Panel value="login">
              <form onSubmit={loginForm.handleSubmit(onLogin)}>
                <Stack>
                  <TextInput
                    label="Email"
                    value={invite.inviteeEmail}
                    readOnly
                    disabled
                  />
                  <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register("password")}
                  />
                  <Button type="submit" fullWidth loading={loading} mt="sm">
                    Sign in &amp; accept
                  </Button>
                </Stack>
              </form>
            </Tabs.Panel>
          </Tabs>
        )}
      </Paper>
    </Center>
  );
}
