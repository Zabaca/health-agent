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
import { signIn, signOut } from "next-auth/react";
import OAuthButtons from "./OAuthButtons";
import { APP_STORE_URL } from "@/lib/constants";

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
  const [success, setSuccess] = useState(false);
  // Set when the "Create account" tab linked the invite to a PRE-EXISTING account
  // instead of creating one — so the success copy points the user at how that
  // account actually signs in ('password' vs 'oauth') rather than the typed password.
  const [existingAccount, setExistingAccount] = useState<null | 'password' | 'oauth'>(null);
  const [activeTab, setActiveTab] = useState<string | null>("register");

  const isSignedInAsInvitee =
    currentUser?.email?.toLowerCase() === invite.inviteeEmail.toLowerCase();

  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });
  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  type AcceptResult = {
    success?: boolean;
    linkedExisting?: boolean;
    existingAuthMethod?: 'password' | 'oauth' | null;
  };

  const acceptInvite = async (action: 'register' | 'login', extra?: object): Promise<AcceptResult | null> => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`/api/invites/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Failed to accept invite");
        return null;
      }
      return data as AcceptResult;
    } catch {
      setServerError("Unexpected error. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterData) => {
    const result = await acceptInvite('register', {
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });
    if (!result) return;
    if (result.linkedExisting) {
      // The email already had an account; the register action linked to it without
      // touching its credentials. Remember how it signs in so the success copy is
      // honest (don't tell an OAuth-only user to use "your existing password").
      setExistingAccount(result.existingAuthMethod ?? 'password');
    } else {
      // Freshly created with the typed password — establish a web session for the
      // eventual web portal. Best-effort; the invite is already accepted.
      await signIn("credentials", {
        email: invite.inviteeEmail,
        password: data.password,
        redirect: false,
      });
    }
    setSuccess(true);
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
    setSuccess(true);
  };

  // Accept under the currently signed-in account (e.g. after OAuth, where the
  // provider email may differ from the invited email). The token is the bearer
  // secret, so the API binds the invite to this session regardless of email.
  const onAcceptAsCurrentUser = async () => {
    const ok = await acceptInvite('login');
    if (!ok) return;
    setSuccess(true);
  };

  if (success) {
    return (
      <Center mih="100vh">
        <Paper shadow="md" p={40} w={460} radius="md">
          <Title order={2} mb="xs" ta="center">
            You&apos;re all set
          </Title>
          <Text c="dimmed" size="sm" ta="center" mb="lg">
            You now have access to <strong>{invite.patientName}</strong>&apos;s health records.
            {existingAccount === 'oauth'
              ? " This email already had a Veladon account — download the app and sign in with Apple or Google, the way you set it up."
              : existingAccount === 'password'
                ? " This email already had a Veladon account — download the app and sign in with your existing password."
                : " Download the Veladon app and sign in to get started."}
          </Text>
          <Button component="a" href={APP_STORE_URL} fullWidth>
            Download the Veladon app
          </Button>
        </Paper>
      </Center>
    );
  }

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
              You&apos;re signed in as <strong>{currentUser.email}</strong>, but this invite was sent to <strong>{invite.inviteeEmail}</strong>. You can accept it with the account you&apos;re signed in as, or sign out to use a different one.
            </Alert>
            <Button fullWidth loading={loading} onClick={onAcceptAsCurrentUser}>
              Accept as {currentUser.email}
            </Button>
            <Button variant="subtle" fullWidth onClick={() => signOut({ redirectTo: `/invite/${token}` })}>
              Sign out
            </Button>
          </Stack>
        ) : (
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List grow mb="md">
              <Tabs.Tab value="register">Create account</Tabs.Tab>
              <Tabs.Tab value="login">I have an account</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="register">
              {/* OAuth account creation. Returns to this page authenticated; the
                  provider email may differ from the invited email, so the page then
                  offers "Accept as {email}" via the bearer-token login action. */}
              <OAuthButtons mode="register" callbackUrl={`/invite/${token}`} />
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
