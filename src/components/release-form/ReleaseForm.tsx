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
  providerType: z.enum(["Medical Group", "Facility"], {
    errorMap: () => ({ message: "Please select a provider type" }),
  }),
  physicianName: z.string().optional(),
  insurance: z.string().optional(),
  patientMemberId: z.string().optional(),
  groupId: z.string().optional(),
  planName: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  providerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
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
}).superRefine((data, ctx) => {
  if (data.providerType === "Medical Group") {
    if (!data.insurance?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Insurance is required", path: ["insurance"] });
    }
    if (!data.patientMemberId?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Insurance Member ID is required", path: ["patientMemberId"] });
    }
  }
});

const releaseSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required").refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Please enter a valid date").refine((val) => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  }, "Date of birth cannot be in the future"),
  mailingAddress: z.string().min(1, "Mailing address is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Please enter a valid email address"),
  ssn: z.string().min(1, "SSN is required"),
  providers: z.array(providerSchema).min(1, "At least one healthcare provider is required"),
  releaseAuthAgent: z.boolean(),
  releaseAuthZabaca: z.boolean(),
  authAgentFirstName: z.string().optional(),
  authAgentLastName: z.string().optional(),
  authAgentOrganization: z.string().optional(),
  authAgentAddress: z.string().optional(),
  authAgentPhone: z.string().optional(),
  authAgentEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  authExpirationDate: z
    .string()
    .min(1, "Expiration date is required")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Please enter a valid date")
    .refine((val) => {
      const date = new Date(val);
      const minDate = new Date();
      minDate.setHours(0, 0, 0, 0);
      minDate.setDate(minDate.getDate() + 90);
      return date >= minDate;
    }, "Expiration date must be at least 90 days from today"),
  authExpirationEvent: z.string().optional(),
  authPrintedName: z.string().min(1, "Printed name is required"),
  authSignatureImage: z.string({ required_error: "Signature is required" }).min(1, "Signature is required"),
  authDate: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !isNaN(new Date(val).getTime()), "Please enter a valid date"),
  authAgentName: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.releaseAuthAgent && !data.releaseAuthZabaca) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one release authorization must be selected",
      path: ["releaseAuthAgent"],
    });
  }
  if (data.releaseAuthAgent) {
    if (!data.authAgentFirstName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "First name is required", path: ["authAgentFirstName"] });
    }
    if (!data.authAgentLastName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Last name is required", path: ["authAgentLastName"] });
    }
    if (!data.authAgentAddress?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Address is required", path: ["authAgentAddress"] });
    }
    if (!data.authAgentPhone?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Phone number is required", path: ["authAgentPhone"] });
    }
  }
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
