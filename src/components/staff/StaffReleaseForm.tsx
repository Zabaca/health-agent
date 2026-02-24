"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stack, Button, Group, Title, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffReleaseSchema, type StaffReleaseFormData, type ProviderFormData } from "@/lib/schemas/release";
import { apiClient } from "@/lib/api/client";
import { errorSchema } from "@/lib/api/response-schemas";
import PatientSection from "@/components/release-form/PatientSection";
import ProviderList from "@/components/release-form/ProviderList";
import AuthorizationSection from "@/components/release-form/AuthorizationSection";
import type { UserProviderRow } from "@/lib/db/types";

interface Props {
  mode: 'admin' | 'agent';
  patientId: string;
  defaultValues?: Partial<StaffReleaseFormData>;
  agentInfo: {
    firstName: string;
    lastName: string;
    organization?: string;
    address: string;
    phone: string;
    email: string;
  };
  savedProviders: UserProviderRow[];
  releaseId?: string;
  redirectAfterSave: string;
}

export default function StaffReleaseForm({
  mode,
  patientId,
  defaultValues,
  agentInfo,
  savedProviders,
  releaseId,
  redirectAfterSave,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const methods = useForm<StaffReleaseFormData>({
    resolver: zodResolver(staffReleaseSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      mailingAddress: "",
      phoneNumber: "",
      email: "",
      ssn: "",
      providers: [],
      releaseAuthAgent: true,
      releaseAuthZabaca: mode === 'admin',
      authPrintedName: "",
      authDate: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
      authSignatureImage: "",
      ...defaultValues,
    },
  });

  const uploadDataUrl = async (dataUrl: string): Promise<string> => {
    if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
    const ext = dataUrl.startsWith("data:image/png") ? "png" : "jpg";
    const result = await apiClient.upload({ body: { data: dataUrl, extension: ext } });
    if (result.status === 200) {
      return result.body.url;
    }
    return dataUrl;
  };

  const onSubmit = async (data: StaffReleaseFormData) => {
    setLoading(true);
    setServerError("");

    try {
      const providerImageResults = await Promise.all(
        data.providers.map((p: ProviderFormData) =>
          Promise.all([
            p.membershipIdFront ? uploadDataUrl(p.membershipIdFront) : Promise.resolve(undefined),
            p.membershipIdBack ? uploadDataUrl(p.membershipIdBack) : Promise.resolve(undefined),
          ])
        )
      );

      const providers = data.providers.map((p: ProviderFormData, i: number) => ({
        ...p,
        membershipIdFront: providerImageResults[i]?.[0],
        membershipIdBack: providerImageResults[i]?.[1],
      }));

      const payload = { ...data, providers };

      if (mode === 'admin') {
        if (releaseId) {
          const result = await apiClient.admin.patientReleases.update({
            params: { id: patientId, releaseId },
            body: payload,
          });
          if (result.status !== 200) {
            setServerError(errorSchema.safeParse(result.body).data?.error || "Failed to save.");
            return;
          }
        } else {
          const result = await apiClient.admin.patientReleases.create({
            params: { id: patientId },
            body: payload,
          });
          if (result.status !== 201) {
            setServerError(errorSchema.safeParse(result.body).data?.error || "Failed to save.");
            return;
          }
        }
      } else {
        if (releaseId) {
          const result = await apiClient.agent.patientReleases.update({
            params: { id: patientId, releaseId },
            body: payload,
          });
          if (result.status !== 200) {
            setServerError(errorSchema.safeParse(result.body).data?.error || "Failed to save.");
            return;
          }
        } else {
          const result = await apiClient.agent.patientReleases.create({
            params: { id: patientId },
            body: payload,
          });
          if (result.status !== 201) {
            setServerError(errorSchema.safeParse(result.body).data?.error || "Failed to save.");
            return;
          }
        }
      }

      notifications.show({
        title: "Saved",
        message: releaseId ? "Release updated successfully" : "Release created successfully",
        color: "green",
      });

      router.push(redirectAfterSave);
      router.refresh();
    } catch {
      setServerError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, () => {
        notifications.show({
          title: "Please fix the errors",
          message: "Some fields need your attention before the form can be submitted.",
          color: "red",
        });
      })}>
        <Stack gap="xl">
          <Group justify="space-between" align="center">
            <Title order={2}>
              {releaseId ? "Edit Release" : "New Medical Record Release"}
            </Title>
          </Group>

          {serverError && <Alert color="red">{serverError}</Alert>}

          <PatientSection />
          <ProviderList savedProviders={savedProviders} />
          <AuthorizationSection staffMode={{ mode, agentInfo }} />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {releaseId ? "Save Changes" : "Create Release"}
            </Button>
          </Group>
        </Stack>
      </form>
    </FormProvider>
  );
}
