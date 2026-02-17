"use client";

import { TextInput, Title, Paper, Stack, SimpleGrid } from "@mantine/core";
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

  const handleSignatureChange = async (dataUrl: string) => {
    if (!dataUrl) {
      setValue("authSignatureImage", "");
      return;
    }

    // Upload signature
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
        // Store as data URL temporarily
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
