"use client";

import { Button, Divider, Stack, Text } from "@mantine/core";
import { IconBrandApple, IconBrandGoogle } from "@tabler/icons-react";
import { signIn } from "next-auth/react";

type Props = {
  /** Where to land after a successful OAuth sign-in. Defaults to /dashboard. */
  callbackUrl?: string;
};

/**
 * Apple + Google sign-in buttons. Used by both LoginForm and RegisterForm —
 * OAuth users skip the register flow entirely (the signIn callback in
 * `auth.config.ts` upserts the user on first sign-in).
 */
export default function OAuthButtons({ callbackUrl = "/dashboard" }: Props) {
  return (
    <Stack gap="sm">
      <Button
        variant="filled"
        color="dark"
        leftSection={<IconBrandApple size={18} />}
        onClick={() => signIn("apple", { redirectTo: callbackUrl })}
        fullWidth
      >
        Continue with Apple
      </Button>
      <Button
        variant="default"
        leftSection={<IconBrandGoogle size={18} color="#DB4437" />}
        onClick={() => signIn("google", { redirectTo: callbackUrl })}
        fullWidth
      >
        Continue with Google
      </Button>
      <Divider
        label={
          <Text size="xs" c="dimmed">
            or continue with email
          </Text>
        }
        labelPosition="center"
      />
    </Stack>
  );
}
