"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stack, Button, Group, Title, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ReleaseFormData } from "@/types/release";
import PatientSection from "./PatientSection";
import ProviderList from "./ProviderList";
import AuthorizationSection from "./AuthorizationSection";

const providerSchema = z.object({
  providerName: z.string().min(1, "Provider name is required"),
  providerType: z.enum(["Insurance", "Facility"]),
  patientMemberId: z.string().optional(),
  groupId: z.string().optional(),
  planName: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  providerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  membershipIdFront: z.string().optional(),
  membershipIdBack: z.string().optional(),
  historyPhysical: z.boolean(),
  diagnosticResults: z.boolean(),
  treatmentProcedure: z.boolean(),
  prescriptionMedication: z.boolean(),
  imagingRadiology: z.boolean(),
  dischargeSummaries: z.boolean(),
  specificRecords: z.boolean(),
  specificRecordsDesc: z.string().optional(),
  dateRangeFrom: z.string().optional(),
  dateRangeTo: z.string().optional(),
  allAvailableDates: z.boolean(),
  purpose: z.string().optional(),
  purposeOther: z.string().optional(),
});

const releaseSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  mailingAddress: z.string().min(1, "Mailing address is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email"),
  ssn: z.string().min(1, "SSN is required"),
  providers: z.array(providerSchema),
  authExpirationDate: z.string().optional(),
  authExpirationEvent: z.string().optional(),
  authPrintedName: z.string().min(1, "Printed name is required"),
  authSignatureImage: z.string().optional(),
  authDate: z.string().min(1, "Date is required"),
  authAgentName: z.string().optional(),
});

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
    defaultValues: defaultValues || {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      mailingAddress: "",
      phoneNumber: "",
      email: "",
      ssn: "",
      providers: [],
      authPrintedName: "",
      authDate: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
    },
  });

  const onSubmit = async (data: ReleaseFormData) => {
    setLoading(true);
    setServerError("");

    try {
      const url = releaseId ? `/api/releases/${releaseId}` : "/api/releases";
      const method = releaseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        setServerError(json.error || "Failed to save. Please try again.");
        return;
      }

      notifications.show({
        title: "Success",
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
      <form onSubmit={methods.handleSubmit(onSubmit)}>
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
