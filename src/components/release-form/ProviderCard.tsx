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
} from "@mantine/core";
import { useFormContext, Controller } from "react-hook-form";
import type { ReleaseFormData } from "@/types/release";
import RecordRequestFields from "./RecordRequestFields";
import FileUploadField from "./FileUploadField";

interface Props {
  index: number;
  onRemove: () => void;
}

const PROVIDER_TYPES = [
  { value: "Medical Group", label: "Medical Group" },
  { value: "Hospital", label: "Hospital" },
  { value: "Clinic", label: "Clinic" },
  { value: "Facility", label: "Facility" },
];

export default function ProviderCard({ index, onRemove }: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<ReleaseFormData>();

  const providerName = watch(`providers.${index}.providerName`) || `Provider ${index + 1}`;
  const providerType = watch(`providers.${index}.providerType`);
  const isInsurance = providerType === "Medical Group";
  const isFacilityType = providerType === "Hospital" || providerType === "Clinic" || providerType === "Facility";
  const providerErrors = errors.providers?.[index];

  return (
    <Accordion.Item value={`provider-${index}`}>
      <Accordion.Control>
        <Stack gap={0}>
          <Title order={5} style={{ margin: 0 }}>
            {providerName}
          </Title>
          <span style={{ fontSize: 12, color: "#868e96" }}>{providerType || "Provider"}</span>
        </Stack>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Provider / Organization Name"
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
          <TextInput
            label="Address"
            error={providerErrors?.address?.message}
            {...register(`providers.${index}.address`)}
          />

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
