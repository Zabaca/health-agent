import { z } from 'zod';

const providerBaseShape = {
  providerName: z.string().min(1, "Provider name is required"),
  providerType: z.enum(["Medical Group", "Hospital", "Clinic", "Facility"], {
    errorMap: () => ({ message: "Please select a provider type" }),
  }),
  physicianName: z.string().optional(),
  patientId: z.string().optional(),
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
};

export const providerSchema = z.object(providerBaseShape).superRefine((data, ctx) => {
  if (data.providerType === "Medical Group") {
    if (!data.insurance?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Insurance is required", path: ["insurance"] });
    }
    if (!data.patientMemberId?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Insurance Member ID is required", path: ["patientMemberId"] });
    }
  }

  const recordFields = ["historyPhysical", "diagnosticResults", "treatmentProcedure", "prescriptionMedication", "imagingRadiology", "dischargeSummaries", "specificRecords"] as const;
  if (!recordFields.some((f) => data[f])) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select at least one record type", path: ["historyPhysical"] });
  }

  if (!data.allAvailableDates) {
    if (!data.dateRangeFrom?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start date is required", path: ["dateRangeFrom"] });
    }
    if (!data.dateRangeTo?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date is required", path: ["dateRangeTo"] });
    }
  }

  if (!data.purpose?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Purpose of release is required", path: ["purpose"] });
  }
});

export const myProviderSchema = z.object(providerBaseShape).omit({
  historyPhysical: true,
  diagnosticResults: true,
  treatmentProcedure: true,
  prescriptionMedication: true,
  imagingRadiology: true,
  dischargeSummaries: true,
  specificRecords: true,
  specificRecordsDesc: true,
  dateRangeFrom: true,
  dateRangeTo: true,
  allAvailableDates: true,
  purpose: true,
  purposeOther: true,
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

const releaseBaseObject = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required")
    .refine((val) => !isNaN(new Date(val).getTime()), "Please enter a valid date")
    .refine((val) => {
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
  authExpirationDate: z.string().min(1, "Expiration date is required")
    .refine((val) => !isNaN(new Date(val).getTime()), "Please enter a valid date")
    .refine((val) => {
      const date = new Date(val);
      const minDate = new Date();
      minDate.setHours(0, 0, 0, 0);
      minDate.setDate(minDate.getDate() + 90);
      return date >= minDate;
    }, "Expiration date must be at least 90 days from today"),
  authExpirationEvent: z.string().optional(),
  authPrintedName: z.string().trim().min(1, "Printed name is required"),
  authSignatureImage: z.string({ required_error: "Signature is required" }).min(1, "Signature is required"),
  authDate: z.string().min(1, "Date is required")
    .refine((val) => !isNaN(new Date(val).getTime()), "Please enter a valid date"),
  authAgentName: z.string().optional(),
});

type ReleaseBaseData = z.infer<typeof releaseBaseObject>;

function releaseRefinement(_data: ReleaseBaseData, _ctx: z.RefinementCtx) {
  // Agent details are auto-populated from the patient's assigned agent — no manual validation needed.
}

export const releaseSchema = releaseBaseObject.superRefine(releaseRefinement);

export const staffReleaseSchema = releaseBaseObject.extend({
  authSignatureImage: z.string().optional().default(''),
  authPrintedName: z.string().trim().default(''),
  authDate: z.string().default(''),
}).superRefine(releaseRefinement);

export type ProviderFormData = z.infer<typeof providerSchema>;
export type MyProviderFormData = z.infer<typeof myProviderSchema>;
export type ReleaseFormData = z.infer<typeof releaseSchema>;
export type StaffReleaseFormData = z.infer<typeof staffReleaseSchema>;
export type MyProvidersFormData = { providers: MyProviderFormData[] };
