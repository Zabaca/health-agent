"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Modal,
  TextInput,
  Button,
  Stack,
  Text,
  Group,
  Center,
} from "@mantine/core";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AvatarUpload from "@/components/shared/AvatarUpload";

const schema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Mailing address is required"),
  avatarUrl: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  firstName: string | null;
  lastName: string | null;
}

export default function PdaOnboardingModal({ firstName, lastName }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError("");
    try {
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: data.phoneNumber,
          address: data.address,
          avatarUrl: data.avatarUrl ?? null,
        }),
      });
      if (!profileRes.ok) {
        setServerError("Failed to save profile. Please try again.");
        return;
      }

      const onboardRes = await fetch("/api/onboarding/complete", { method: "PATCH" });
      if (!onboardRes.ok) {
        setServerError("Failed to complete onboarding. Please try again.");
        return;
      }

      await update({ onboarded: true });
      router.refresh();
    } catch {
      setServerError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || undefined;

  return (
    <Modal
      opened
      onClose={() => {}}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      centered
      size="sm"
      title="Complete your profile"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Before you get started, add a few quick details so patients and staff can reach you.
          </Text>

          <Center>
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
          </Center>

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

          {serverError && (
            <Text size="sm" c="red">{serverError}</Text>
          )}

          <Group justify="flex-end">
            <Button type="submit" loading={loading}>
              Get started
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
