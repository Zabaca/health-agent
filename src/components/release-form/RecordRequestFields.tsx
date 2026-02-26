"use client";

import {
  Checkbox,
  SimpleGrid,
  TextInput,
  Textarea,
  Title,
  Stack,
  Group,
  Select,
  Text,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useFormContext, Controller } from "react-hook-form";
import type { ReleaseFormData } from "@/types/release";

const PURPOSE_OPTIONS = [
  { value: "Continuing care", label: "Continuing care" },
  { value: "Personal records", label: "Personal records" },
  { value: "Insurance/legal", label: "Insurance/legal" },
  { value: "Other", label: "Other" },
];

interface Props {
  index: number;
}

export default function RecordRequestFields({ index }: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<ReleaseFormData>();

  const specificRecords = watch(`providers.${index}.specificRecords`);
  const allAvailableDates = watch(`providers.${index}.allAvailableDates`);
  const purpose = watch(`providers.${index}.purpose`);
  const providerErrors = errors.providers?.[index];

  return (
    <Stack gap="sm">
      <Title order={6}>Records to Release <span style={{ color: "var(--mantine-color-error)" }}>*</span></Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Controller
          name={`providers.${index}.historyPhysical`}
          control={control}
          render={({ field }) => (
            <Checkbox
              label="History & Physical"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name={`providers.${index}.diagnosticResults`}
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Diagnostic Results"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name={`providers.${index}.treatmentProcedure`}
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Treatment/Procedure Notes"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name={`providers.${index}.prescriptionMedication`}
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Prescription/Medication"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name={`providers.${index}.imagingRadiology`}
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Imaging/Radiology"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name={`providers.${index}.dischargeSummaries`}
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Discharge Summaries"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name={`providers.${index}.specificRecords`}
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Specific Records"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </SimpleGrid>
      {providerErrors?.historyPhysical?.message && (
        <Text c="red" size="xs">{providerErrors.historyPhysical.message}</Text>
      )}

      {specificRecords && (
        <Textarea
          label="Specific Records Description"
          placeholder="Describe specific records needed..."
          error={providerErrors?.specificRecordsDesc?.message}
          {...register(`providers.${index}.specificRecordsDesc`)}
        />
      )}

      <Title order={6} mt="sm">
        Date Range <span style={{ color: "var(--mantine-color-error)" }}>*</span>
      </Title>
      <Controller
        name={`providers.${index}.allAvailableDates`}
        control={control}
        render={({ field }) => (
          <Checkbox
            label="All available dates"
            checked={field.value}
            onChange={field.onChange}
          />
        )}
      />
      {!allAvailableDates && (
        <Group>
          <Controller
            name={`providers.${index}.dateRangeFrom`}
            control={control}
            render={({ field }) => (
              <DatePickerInput
                label="From"
                placeholder="MM/DD/YYYY"
                popoverProps={{ withinPortal: true, zIndex: 300 }}
                error={providerErrors?.dateRangeFrom?.message}
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
          <Controller
            name={`providers.${index}.dateRangeTo`}
            control={control}
            render={({ field }) => (
              <DatePickerInput
                label="To"
                placeholder="MM/DD/YYYY"
                popoverProps={{ withinPortal: true, zIndex: 300 }}
                error={providerErrors?.dateRangeTo?.message}
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
        </Group>
      )}

      <Controller
        name={`providers.${index}.purpose`}
        control={control}
        render={({ field }) => (
          <Select
            label="Purpose of Release"
            placeholder="Select purpose"
            data={PURPOSE_OPTIONS}
            value={field.value || null}
            onChange={field.onChange}
            error={providerErrors?.purpose?.message}
            withAsterisk
          />
        )}
      />
      {purpose === "Other" && (
        <TextInput
          label="Other purpose"
          placeholder="Describe the purpose..."
          error={providerErrors?.purposeOther?.message}
          {...register(`providers.${index}.purposeOther`)}
        />
      )}
    </Stack>
  );
}
