"use client";

import { SimpleGrid, TextInput, Title, Paper } from "@mantine/core";
import { useFormContext } from "react-hook-form";
import type { ReleaseFormData } from "@/types/release";

export default function PatientSection() {
  const {
    register,
    trigger,
    formState: { errors },
  } = useFormContext<ReleaseFormData>();

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4} mb="md">
        Patient Information
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
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
      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="md">
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
        label="Mailing Address"
        required
        mb="md"
        error={errors.mailingAddress?.message}
        {...register("mailingAddress")}
      />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Phone Number"
          required
          error={errors.phoneNumber?.message}
          {...register("phoneNumber")}
        />
        <TextInput
          label="Email"
          type="email"
          required
          error={errors.email?.message}
          {...register("email")}
        />
      </SimpleGrid>
    </Paper>
  );
}
