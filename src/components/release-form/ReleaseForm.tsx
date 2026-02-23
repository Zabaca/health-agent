"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stack, Button, Group, Title, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { releaseSchema, type ReleaseFormData } from "@/lib/schemas/release";
import { apiClient } from "@/lib/api/client";
import PatientSection from "./PatientSection";
import ProviderList from "./ProviderList";
import AuthorizationSection from "./AuthorizationSection";

interface Props {
  releaseId?: string;
  defaultValues?: Partial<ReleaseFormData>;
}

export default function ReleaseForm({ releaseId, defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const methods = useForm<ReleaseFormData>({
    resolver: zodResolver(releaseSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      mailingAddress: "",
      phoneNumber: "",
      email: "",
      ssn: "",
      providers: [],
      releaseAuthAgent: false,
      releaseAuthZabaca: false,
      authPrintedName: "",
      authDate: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
      ...defaultValues,
    },
  });

  const uploadDataUrl = async (dataUrl: string): Promise<string> => {
    if (!dataUrl.startsWith("data:")) return dataUrl;
    const ext = dataUrl.startsWith("data:image/png") ? "png" : "jpg";
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: dataUrl, extension: ext }),
    });
    if (res.ok) {
      const { url } = await res.json();
      return url;
    }
    return dataUrl;
  };

  const onSubmit = async (data: ReleaseFormData) => {
    setLoading(true);
    setServerError("");

    try {
      // Upload all data URL images before submitting
      const [signatureUrl, ...providerImageResults] = await Promise.all([
        uploadDataUrl(data.authSignatureImage),
        ...data.providers.map((p) =>
          Promise.all([
            p.membershipIdFront ? uploadDataUrl(p.membershipIdFront) : Promise.resolve(undefined),
            p.membershipIdBack ? uploadDataUrl(p.membershipIdBack) : Promise.resolve(undefined),
          ])
        ),
      ]);

      const providers = data.providers.map((p, i) => ({
        ...p,
        membershipIdFront: providerImageResults[i]?.[0],
        membershipIdBack: providerImageResults[i]?.[1],
      }));

      const payload = { ...data, authSignatureImage: signatureUrl, providers };

      if (releaseId) {
        const result = await apiClient.releases.update({ params: { id: releaseId }, body: payload });
        if (result.status !== 200) {
          setServerError((result.body as { error: string }).error || "Failed to save. Please try again.");
          return;
        }
      } else {
        const result = await apiClient.releases.create({ body: payload });
        if (result.status !== 201) {
          setServerError((result.body as { error: string }).error || "Failed to save. Please try again.");
          return;
        }
      }

      notifications.show({
        title: "Saved",
        message: releaseId ? "Release updated successfully" : "Release created successfully",
        color: "green",
      });

      router.push("/dashboard");
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
          <ProviderList />
          <AuthorizationSection />

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
