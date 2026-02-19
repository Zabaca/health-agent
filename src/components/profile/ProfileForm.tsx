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
} from "@mantine/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/lib/schemas/profile";

interface ProfileFormProps {
  defaultValues: ProfileFormData;
}

export default function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setSuccess(false);
    setServerError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        setServerError("Failed to save profile. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setServerError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper withBorder p="xl" radius="md" maw={700}>
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

          <Button type="submit" loading={loading} w="fit-content">
            Save Profile
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
