"use client";

import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Anchor,
  Alert,
  Stack,
  Center,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { isAdult, MINIMUM_AGE } from "@health-agent/types";
import OAuthButtons from "./OAuthButtons";

const schema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth is required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => isAdult(d.dateOfBirth), {
    message: `You must be ${MINIMUM_AGE} or older to use Veladon.`,
    path: ["dateOfBirth"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterForm() {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError("");

    try {
      const result = await apiClient.register({
        body: { email: data.email, password: data.password, dateOfBirth: data.dateOfBirth },
      });

      if (result.status !== 201 && result.status !== 200) {
        setServerError((result.body as { error: string }).error || "Registration failed");
        return;
      }

      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirectTo: "/dashboard",
      });
    } catch {
      setServerError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh">
      <Paper shadow="md" p={40} w={420} radius="md">
        <Title order={2} mb="xs" ta="center">
          Create an account
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="lg">
          Already have an account?{" "}
          <Anchor component={Link} href="/login">
            Sign in
          </Anchor>
        </Text>

        {serverError && (
          <Alert color="red" mb="md">
            {serverError}
          </Alert>
        )}

        <Stack mb="md">
          <OAuthButtons />
        </Stack>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="you@example.com"
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <PasswordInput
              label="Password"
              placeholder="Min 8 characters"
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Repeat password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <TextInput
              label="Date of Birth"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth")}
            />
            <Button type="submit" fullWidth loading={loading} mt="sm">
              Create Account
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
