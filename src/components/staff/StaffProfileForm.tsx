"use client";

import { useState } from "react";
import { Paper, Title, TextInput, Button, Stack, SimpleGrid, Text } from "@mantine/core";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffProfileSchema, type StaffProfileFormData } from "@/lib/schemas/profile";
import AvatarUpload from "@/components/shared/AvatarUpload";

interface Props {
  defaultValues?: Partial<StaffProfileFormData>;
  onSave: (data: StaffProfileFormData) => Promise<{ ok: boolean }>;
}

export default function StaffProfileForm({ defaultValues, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<StaffProfileFormData>({
    resolver: zodResolver(staffProfileSchema),
    defaultValues: defaultValues ?? {},
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const nameForInitials = [firstName, lastName].filter(Boolean).join(" ");

  const onSubmit = async (data: StaffProfileFormData) => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const result = await onSave(data);
      if (result.ok) {
        setSaved(true);
      } else {
        setError("Failed to save profile.");
      }
    } catch {
      setError("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper withBorder p="md" radius="md" maw={640}>
      <Title order={4} mb="md">My Profile</Title>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <Controller
            name="avatarUrl"
            control={control}
            render={({ field }) => (
              <AvatarUpload
                value={field.value}
                onChange={field.onChange}
                name={nameForInitials}
              />
            )}
          />
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <TextInput
              label="First Name"
              required
              error={errors.firstName?.message}
              {...register("firstName")}
            />
            <TextInput
              label="Middle Name"
              error={errors.middleName?.message}
              {...register("middleName")}
            />
            <TextInput
              label="Last Name"
              required
              error={errors.lastName?.message}
              {...register("lastName")}
            />
          </SimpleGrid>
          <TextInput
            label="Phone Number"
            required
            error={errors.phoneNumber?.message}
            {...register("phoneNumber")}
          />
          <TextInput
            label="Address"
            required
            error={errors.address?.message}
            {...register("address")}
          />
          {error && <Text c="red" size="sm">{error}</Text>}
          {saved && <Text c="green" size="sm">Profile saved.</Text>}
          <Button type="submit" loading={saving} disabled={!isDirty}>
            Save Profile
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
