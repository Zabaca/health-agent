"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Paper, Stack, TextInput, Button, Group, Alert, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AvatarUpload from "@/components/shared/AvatarUpload";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Mailing address is required"),
  avatarUrl: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues: FormData;
}

export default function PdaAccountForm({ defaultValues }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || undefined;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setServerError("Failed to save. Please try again.");
        return;
      }
      await update();
      router.refresh();
      notifications.show({ title: "Saved", message: "Your account has been updated.", color: "green" });
    } catch {
      setServerError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2}>My Account</Title>
        <Button type="submit" loading={loading}>Save changes</Button>
      </Group>

      {serverError && <Alert color="red" mb="md">{serverError}</Alert>}

      <Paper withBorder p="lg" radius="md">
        <Stack gap="md">
          <Controller
            name="avatarUrl"
            control={control}
            render={({ field }) => (
              <AvatarUpload
                value={field.value ?? null}
                onChange={field.onChange}
                name={displayName}
              />
            )}
          />

          <Group grow>
            <TextInput
              label="First name"
              required
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <TextInput
              label="Last name"
              required
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </Group>

          <TextInput
            label="Phone number"
            placeholder="+1 (555) 000-0000"
            required
            error={errors.phoneNumber?.message}
            {...register("phoneNumber")}
          />

          <TextInput
            label="Mailing address"
            placeholder="123 Main St, City, State, ZIP"
            required
            error={errors.address?.message}
            {...register("address")}
          />
        </Stack>
      </Paper>
    </form>
  );
}
