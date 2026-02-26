"use client";

import { SimpleGrid, TextInput, Title, Paper } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useFormContext, Controller } from "react-hook-form";
import type { ReleaseFormData } from "@/types/release";

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
            <DatePickerInput
              label="Date of Birth"
              placeholder="MM/DD/YYYY"
              required
              maxDate={new Date()}
              popoverProps={{ withinPortal: true, zIndex: 300 }}
              error={errors.dateOfBirth?.message}
              value={field.value ? new Date(field.value) : null}
              onChange={(date) =>
                field.onChange(
                  date
                    ? date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
                    : ""
                )
              }
            />
          )}
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
