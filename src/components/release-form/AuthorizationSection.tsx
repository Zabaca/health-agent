"use client";

import { TextInput, Title, Paper, Stack, SimpleGrid, Checkbox, Group, Text } from "@mantine/core";
import { useFormContext, Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import type { ReleaseFormData } from "@/types/release";

const SignaturePad = dynamic(() => import("./SignaturePad"), { ssr: false });

export default function AuthorizationSection() {
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

  const handleSignatureChange = async (dataUrl: string) => {
    if (!dataUrl) {
      setValue("authSignatureImage", "");
      return;
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataUrl, extension: "png" }),
      });

      if (res.ok) {
        const { url } = await res.json();
        setValue("authSignatureImage", url);
      } else {
        setValue("authSignatureImage", dataUrl);
      }
    } catch {
      setValue("authSignatureImage", dataUrl);
    }
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
                />
              )}
            />
          </Group>
          {errors.releaseAuthAgent && (
            <Text c="red" size="xs">{errors.releaseAuthAgent.message}</Text>
          )}
        </Stack>

        {releaseAuthAgent && (
          <Paper withBorder p="sm" radius="md">
            <Stack gap="md">
              <Title order={6}>Agent Details</Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="First Name"
                  required
                  error={errors.authAgentFirstName?.message}
                  {...register("authAgentFirstName")}
                />
                <TextInput
                  label="Last Name"
                  required
                  error={errors.authAgentLastName?.message}
                  {...register("authAgentLastName")}
                />
              </SimpleGrid>
              <TextInput
                label="Organization"
                error={errors.authAgentOrganization?.message}
                {...register("authAgentOrganization")}
              />
              <TextInput
                label="Address"
                required
                error={errors.authAgentAddress?.message}
                {...register("authAgentAddress")}
              />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="Phone Number"
                  required
                  error={errors.authAgentPhone?.message}
                  {...register("authAgentPhone")}
                />
                <TextInput
                  label="Email"
                  type="email"
                  error={errors.authAgentEmail?.message}
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
      </Stack>
    </Paper>
  );
}
