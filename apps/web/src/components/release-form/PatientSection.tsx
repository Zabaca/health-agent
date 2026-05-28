"use client";

import { SimpleGrid, TextInput, Title, Paper } from "@mantine/core";
import { useFormContext, Controller } from "react-hook-form";
import type { ReleaseFormData } from "@/types/release";
import IsoDatePickerInput from "@/components/shared/IsoDatePickerInput";

export default function PatientSection() {
  const {
    register,
    control,
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
        <Controller
          name="dateOfBirth"
          control={control}
          render={({ field }) => (
            <IsoDatePickerInput
              label="Date of Birth"
              required
              maxDate={new Date()}
              popoverProps={{ withinPortal: true, zIndex: 300 }}
              styles={{ root: { alignSelf: 'end' } }}
              error={errors.dateOfBirth?.message}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <TextInput
          label="Social Security Number (Last 4 digits)"
          placeholder="1234"
          maxLength={4}
          description="Optional — last 4 digits only. Helps verify your identity."
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
