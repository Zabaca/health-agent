"use client";

import { useEffect } from "react";
import { TextInput, Title, Paper, Stack, SimpleGrid, Checkbox, Group, Text } from "@mantine/core";
import { useFormContext, Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import type { ReleaseFormData } from "@/types/release";

const SignaturePad = dynamic(() => import("./SignaturePad"), { ssr: false });

interface StaffModeProps {
  mode: 'admin' | 'agent';
  agentInfo: {
    firstName: string;
    lastName: string;
    organization?: string;
    address: string;
    phone: string;
    email: string;
  };
}

interface Props {
  staffMode?: StaffModeProps;
}

export default function AuthorizationSection({ staffMode }: Props) {
  const {
    register,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext<ReleaseFormData>();

  const sigValue = watch("authSignatureImage");
  const releaseAuthAgent = watch("releaseAuthAgent");

  useEffect(() => {
    if (!staffMode) return;
    setValue("releaseAuthAgent", true);
    setValue("authAgentFirstName", staffMode.agentInfo.firstName);
    setValue("authAgentLastName", staffMode.agentInfo.lastName);
    setValue("authAgentOrganization", staffMode.agentInfo.organization ?? "");
    setValue("authAgentAddress", staffMode.agentInfo.address);
    setValue("authAgentPhone", staffMode.agentInfo.phone);
    setValue("authAgentEmail", staffMode.agentInfo.email);
    setValue("authSignatureImage", "");
    if (staffMode.mode === 'admin') {
      setValue("releaseAuthZabaca", true);
    }
  }, [staffMode, setValue]);

  const handleSignatureChange = (dataUrl: string) => {
    setValue("authSignatureImage", dataUrl);
    trigger("authSignatureImage");
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4} mb="md">
        Authorization
      </Title>
      <Stack gap="md">
        <Stack gap="xs">
          <Text fw={500} size="sm">
            Release Authorization <Text component="span" c="red">*</Text>
          </Text>
          <Group gap="xl">
            <Controller
              name="releaseAuthAgent"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label="Agent"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
                  disabled={!!staffMode}
                />
              )}
            />
            <Controller
              name="releaseAuthZabaca"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label="Zabaca"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
                  disabled={staffMode?.mode === 'admin'}
                />
              )}
            />
          </Group>
          {errors.releaseAuthAgent && (
            <Text c="red" size="xs">{errors.releaseAuthAgent.message}</Text>
          )}
        </Stack>

        {(releaseAuthAgent || staffMode) && (
          <Paper withBorder p="sm" radius="md">
            <Stack gap="md">
              <Title order={6}>Agent Details</Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="First Name"
                  required
                  error={errors.authAgentFirstName?.message}
                  disabled={!!staffMode}
                  {...register("authAgentFirstName")}
                />
                <TextInput
                  label="Last Name"
                  required
                  error={errors.authAgentLastName?.message}
                  disabled={!!staffMode}
                  {...register("authAgentLastName")}
                />
              </SimpleGrid>
              <TextInput
                label="Organization"
                error={errors.authAgentOrganization?.message}
                disabled={!!staffMode}
                {...register("authAgentOrganization")}
              />
              <TextInput
                label="Address"
                required
                error={errors.authAgentAddress?.message}
                disabled={!!staffMode}
                {...register("authAgentAddress")}
              />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="Phone Number"
                  required
                  error={errors.authAgentPhone?.message}
                  disabled={!!staffMode}
                  {...register("authAgentPhone")}
                />
                <TextInput
                  label="Email"
                  type="email"
                  error={errors.authAgentEmail?.message}
                  disabled={!!staffMode}
                  {...register("authAgentEmail")}
                />
              </SimpleGrid>
            </Stack>
          </Paper>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Authorization Expiration Date"
            placeholder="MM/DD/YYYY"
            required
            error={errors.authExpirationDate?.message}
            {...register("authExpirationDate", {
              onBlur: () => trigger("authExpirationDate"),
            })}
          />
          <TextInput
            label="Expiration Event"
            placeholder="e.g., Upon completion of treatment"
            error={errors.authExpirationEvent?.message}
            {...register("authExpirationEvent")}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Printed Name"
            required
            error={errors.authPrintedName?.message}
            {...register("authPrintedName")}
          />
          <TextInput
            label="Date"
            placeholder="MM/DD/YYYY"
            required
            error={errors.authDate?.message}
            {...register("authDate", {
              onBlur: (e) => {
                const date = new Date(e.target.value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (isNaN(date.getTime()) || date < today) {
                  setValue(
                    "authDate",
                    today.toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })
                  );
                }
                trigger("authDate");
              },
            })}
          />
        </SimpleGrid>

        <TextInput
          label="Agent / Representative Name (if applicable)"
          error={errors.authAgentName?.message}
          {...register("authAgentName")}
        />

        {staffMode ? (
          <TextInput label="Patient Signature" disabled placeholder="Patient Signature" />
        ) : (
          <Controller
            name="authSignatureImage"
            control={control}
            render={() => (
              <SignaturePad
                value={sigValue}
                onChange={handleSignatureChange}
                error={errors.authSignatureImage?.message}
              />
            )}
          />
        )}
      </Stack>
    </Paper>
  );
}
