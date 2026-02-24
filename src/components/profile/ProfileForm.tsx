"use client";

import { useState } from "react";
import {
  TextInput,
  Button,
  Paper,
  Title,
  SimpleGrid,
  Stack,
  Alert,
  Group,
} from "@mantine/core";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/lib/schemas/profile";
import { apiClient } from "@/lib/api/client";
import AvatarUpload from "@/components/shared/AvatarUpload";

interface ProfileFormProps {
  defaultValues: ProfileFormData;
  onComplete?: (data: ProfileFormData) => void;
  maw?: number | string;
}

export default function ProfileForm({ defaultValues, onComplete, maw = 700 }: ProfileFormProps) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const nameForInitials = [firstName, lastName].filter(Boolean).join(" ");

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setSuccess(false);
    setServerError("");

    try {
      const result = await apiClient.profile.update({ body: data });

      if (result.status !== 200) {
        setServerError("Failed to save profile. Please try again.");
      } else if (onComplete) {
        onComplete(data);
      } else {
        setSuccess(true);
        reset(data);
      }
    } catch {
      setServerError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper withBorder p="xl" radius="md" maw={maw} w="100%">
      <Title order={3} mb="lg">
        My Profile
      </Title>

      {success && (
        <Alert color="green" mb="md">
          Profile saved successfully.
        </Alert>
      )}
      {serverError && (
        <Alert color="red" mb="md">
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
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

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Date of Birth"
              placeholder="MM/DD/YYYY"
              required
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth", { onBlur: () => trigger("dateOfBirth") })}
            />
            <TextInput
              label="Social Security Number"
              placeholder="XXX-XX-XXXX"
              required
              error={errors.ssn?.message}
              {...register("ssn")}
            />
          </SimpleGrid>

          <TextInput
            label="Address"
            required
            error={errors.address?.message}
            {...register("address")}
          />

          <TextInput
            label="Phone Number"
            required
            error={errors.phoneNumber?.message}
            {...register("phoneNumber")}
          />

          <Group justify="flex-end">
            <Button type="submit" loading={loading} disabled={!isDirty}>
              Save Profile
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
