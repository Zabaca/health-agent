"use client";

import {
  Accordion,
  TextInput,
  Select,
  SimpleGrid,
  Button,
  Stack,
  Title,
  Divider,
  Group,
  Text,
} from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";
import { useFormContext, Controller } from "react-hook-form";
import type { ReleaseFormData } from "@/types/release";
import RecordRequestFields from "./RecordRequestFields";
import FileUploadField from "./FileUploadField";

interface Props {
  index: number;
  onRemove: () => void;
  dragHandleProps?: object;
}

const PROVIDER_TYPES = [
  { value: "Medical Group", label: "Medical Group" },
  { value: "Hospital", label: "Hospital" },
  { value: "Clinic", label: "Clinic" },
  { value: "Facility", label: "Facility (Clinics, Primary Care Physician, Urgent Care, Labs, etc)" },
];

export default function ProviderCard({ index, onRemove, dragHandleProps }: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<ReleaseFormData>();

  const providerName = watch(`providers.${index}.providerName`) || `Provider ${index + 1}`;
  const providerType = watch(`providers.${index}.providerType`);
  const isInsurance = providerType === "Medical Group";
  const isFacilityType = providerType === "Hospital" || providerType === "Clinic";
  const isClinic = providerType === "Clinic";
  const providerErrors = errors.providers?.[index];
  const hasErrors = !!providerErrors;

  return (
    <Accordion.Item
      value={`provider-${index}`}
      style={hasErrors ? { borderColor: "var(--mantine-color-red-5)" } : undefined}
    >
      <Accordion.Control>
        <Group gap="xs" wrap="nowrap" align="center">
          <div
            {...(dragHandleProps as React.HTMLAttributes<HTMLDivElement>)}
            style={{ display: "flex", alignItems: "center", color: "var(--mantine-color-gray-5)", touchAction: "none", cursor: "grab" }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconGripVertical size={16} />
          </div>
          <Stack gap={0} style={{ flex: 1 }}>
            <Title order={5} style={{ margin: 0, color: hasErrors ? "var(--mantine-color-red-6)" : undefined }}>
              {providerName}
            </Title>
            <span style={{ fontSize: 12, color: "#868e96" }}>{providerType || "Provider"}</span>
          </Stack>
          {hasErrors && (
            <Text size="xs" c="red" fw={500}>
              Fix errors
            </Text>
          )}
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Individual / Organization Name"
              required
              error={providerErrors?.providerName?.message}
              {...register(`providers.${index}.providerName`)}
            />
            <Controller
              name={`providers.${index}.providerType`}
              control={control}
              render={({ field }) => (
                <Select
                  label="Provider Type"
                  required
                  data={PROVIDER_TYPES}
                  placeholder="Select a type"
                  value={field.value || null}
                  onChange={field.onChange}
                  error={providerErrors?.providerType?.message}
                />
              )}
            />
          </SimpleGrid>

          {isFacilityType && (
            <TextInput
              label="Patient ID"
              error={providerErrors?.patientId?.message}
              {...register(`providers.${index}.patientId`)}
            />
          )}

          {isClinic && (
            <TextInput
              label="Physician Name"
              error={providerErrors?.physicianName?.message}
              {...register(`providers.${index}.physicianName`)}
            />
          )}

          {isInsurance && (
            <>
              <TextInput
                label="Insurance"
                required
                error={providerErrors?.insurance?.message}
                {...register(`providers.${index}.insurance`)}
              />
              <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <TextInput
                  label="Insurance Member ID"
                  required
                  error={providerErrors?.patientMemberId?.message}
                  {...register(`providers.${index}.patientMemberId`)}
                />
                <TextInput
                  label="Insurance Group ID"
                  error={providerErrors?.groupId?.message}
                  {...register(`providers.${index}.groupId`)}
                />
                <TextInput
                  label="Insurance Plan Name"
                  error={providerErrors?.planName?.message}
                  {...register(`providers.${index}.planName`)}
                />
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Controller
                  name={`providers.${index}.membershipIdFront`}
                  control={control}
                  render={({ field }) => (
                    <FileUploadField
                      label="Membership Card (Front)"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  name={`providers.${index}.membershipIdBack`}
                  control={control}
                  render={({ field }) => (
                    <FileUploadField
                      label="Membership Card (Back)"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </SimpleGrid>
            </>
          )}

          <TextInput
            label="Address"
            error={providerErrors?.address?.message}
            {...register(`providers.${index}.address`)}
          />
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <TextInput
              label="Phone"
              error={providerErrors?.phone?.message}
              {...register(`providers.${index}.phone`)}
            />
            <TextInput
              label="Fax"
              error={providerErrors?.fax?.message}
              {...register(`providers.${index}.fax`)}
            />
            <TextInput
              label="Email"
              type="email"
              error={providerErrors?.providerEmail?.message}
              {...register(`providers.${index}.providerEmail`)}
            />
          </SimpleGrid>

          <Divider />
          <RecordRequestFields index={index} />

          <Button
            variant="light"
            color="red"
            size="sm"
            onClick={onRemove}
            mt="sm"
          >
            Remove Provider
          </Button>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
