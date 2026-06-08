"use client";

import { Button, Divider, Stack, Text } from "@mantine/core";
import { IconBrandApple, IconBrandGoogle } from "@tabler/icons-react";
import { signIn } from "next-auth/react";

type Props = {
  /** Where to land after a successful OAuth sign-in. Defaults to /dashboard. */
  callbackUrl?: string;
  /** Controls button verb: "signin" → "Continue with X", "register" → "Create with X". */
  mode?: "signin" | "register";
};

/**
 * Apple + Google sign-in buttons. Used by both LoginForm and RegisterForm —
 * OAuth users skip the register flow entirely (the signIn callback in
 * `auth.config.ts` upserts the user on first sign-in).
 */
export default function OAuthButtons({ callbackUrl = "/dashboard", mode = "signin" }: Props) {
  const verb = mode === "register" ? "Create" : "Continue";
  const dividerLabel = mode === "register" ? "or sign up with email" : "or continue with email";
  return (
    <Stack gap="sm">
      <Button
        variant="filled"
        color="dark"
        leftSection={<IconBrandApple size={18} />}
        onClick={() => signIn("apple", { redirectTo: callbackUrl })}
        fullWidth
      >
        {verb} with Apple
      </Button>
      <Button
        variant="default"
        leftSection={<IconBrandGoogle size={18} color="#DB4437" />}
        onClick={() => signIn("google", { redirectTo: callbackUrl })}
        fullWidth
      >
        {verb} with Google
      </Button>
      <Divider
        label={
          <Text size="xs" c="dimmed">
            {dividerLabel}
          </Text>
        }
        labelPosition="center"
      />
    </Stack>
  );
}
