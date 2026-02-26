"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stack, Button, Group, Title, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { releaseSchema, type ReleaseFormData } from "@/lib/schemas/release";
import { apiClient } from "@/lib/api/client";
import { errorSchema } from "@/lib/api/response-schemas";
import PatientSection from "./PatientSection";
import ProviderList from "./ProviderList";
import AuthorizationSection from "./AuthorizationSection";
import { rowToFormData } from "./AddProviderModal";
import type { UserProviderRow } from "@/lib/db/types";

interface AssignedAgent {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  address: string | null;
}

interface Props {
  releaseId?: string;
  defaultValues?: Partial<ReleaseFormData>;
  assignedAgent?: AssignedAgent | null;
  savedProviders?: UserProviderRow[];
  onComplete?: (releaseId: string) => void;
  onBack?: () => void;
}

export default function ReleaseForm({ releaseId, defaultValues, assignedAgent, savedProviders, onComplete, onBack }: Props) {
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
      providers: savedProviders?.map(rowToFormData) ?? [],
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
    const result = await apiClient.upload({ body: { data: dataUrl, extension: ext } });
    if (result.status === 200) {
      return result.body.url;
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

      let savedReleaseId = releaseId;

      if (releaseId) {
        const result = await apiClient.releases.update({ params: { id: releaseId }, body: payload });
        if (result.status !== 200) {
          setServerError(errorSchema.safeParse(result.body).data?.error || "Failed to save. Please try again.");
          return;
        }
      } else {
        const result = await apiClient.releases.create({ body: payload });
        if (result.status !== 201) {
          setServerError(errorSchema.safeParse(result.body).data?.error || "Failed to save. Please try again.");
          return;
        }
        savedReleaseId = result.body.id;
      }

      if (!onComplete) {
        notifications.show({
          title: "Saved",
          message: releaseId ? "Release updated successfully" : "Release created successfully",
          color: "green",
        });
      }

      if (onComplete && savedReleaseId) {
        onComplete(savedReleaseId);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
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
          <ProviderList
            savedProviders={savedProviders}
            initialUsedProviderIds={savedProviders?.map((p) => p.id)}
          />
          <AuthorizationSection assignedAgent={assignedAgent} />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => onBack ? onBack() : router.back()}>
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
