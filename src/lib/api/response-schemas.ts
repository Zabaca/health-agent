import { z } from 'zod';

export const providerRowSchema = z.object({
  id: z.string(),
  releaseId: z.string(),
  order: z.number(),
  providerName: z.string(),
  providerType: z.string(),
  physicianName: z.string().nullable(),
  patientId: z.string().nullable(),
  insurance: z.string().nullable(),
  patientMemberId: z.string().nullable(),
  groupId: z.string().nullable(),
  planName: z.string().nullable(),
  phone: z.string().nullable(),
  fax: z.string().nullable(),
  providerEmail: z.string().nullable(),
  address: z.string().nullable(),
  membershipIdFront: z.string().nullable(),
  membershipIdBack: z.string().nullable(),
  historyPhysical: z.boolean(),
  diagnosticResults: z.boolean(),
  treatmentProcedure: z.boolean(),
  prescriptionMedication: z.boolean(),
  imagingRadiology: z.boolean(),
  dischargeSummaries: z.boolean(),
  specificRecords: z.boolean(),
  specificRecordsDesc: z.string().nullable(),
  dateRangeFrom: z.string().nullable(),
  dateRangeTo: z.string().nullable(),
  allAvailableDates: z.boolean(),
  purpose: z.string().nullable(),
  purposeOther: z.string().nullable(),
});

export const releaseWithProvidersSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  firstName: z.string(),
  middleName: z.string().nullable(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  mailingAddress: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  ssn: z.string(),
  releaseAuthAgent: z.boolean(),
  releaseAuthZabaca: z.boolean(),
  authAgentFirstName: z.string().nullable(),
  authAgentLastName: z.string().nullable(),
  authAgentOrganization: z.string().nullable(),
  authAgentAddress: z.string().nullable(),
  authAgentPhone: z.string().nullable(),
  authAgentEmail: z.string().nullable(),
  authExpirationDate: z.string().nullable(),
  authExpirationEvent: z.string().nullable(),
  authPrintedName: z.string(),
  authSignatureImage: z.string().nullable(),
  authDate: z.string(),
  authAgentName: z.string().nullable(),
  voided: z.boolean(),
  providers: z.array(providerRowSchema),
});

export const releaseSummarySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  voided: z.boolean(),
});

export const userProviderRowSchema = z.object({
  id: z.string(),
  userId: z.string(),
  order: z.number(),
  providerName: z.string(),
  providerType: z.string(),
  physicianName: z.string().nullable(),
  patientId: z.string().nullable(),
  insurance: z.string().nullable(),
  patientMemberId: z.string().nullable(),
  groupId: z.string().nullable(),
  planName: z.string().nullable(),
  phone: z.string().nullable(),
  fax: z.string().nullable(),
  providerEmail: z.string().nullable(),
  address: z.string().nullable(),
  membershipIdFront: z.string().nullable(),
  membershipIdBack: z.string().nullable(),
});

export const errorSchema = z.object({ error: z.string() });
export const successSchema = z.object({ success: z.boolean() });
export const uploadResponseSchema = z.object({ url: z.string() });
export const registerResponseSchema = z.object({ id: z.string(), email: z.string() });

export const scheduledCallSchema = z.object({
  id: z.string(),
  scheduledAt: z.string(),
  status: z.enum(['scheduled', 'cancelled']),
  createdAt: z.string(),
  updatedAt: z.string(),
  agent: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
    address: z.string().nullable(),
  }),
});

export const staffScheduledCallSchema = z.object({
  id: z.string(),
  scheduledAt: z.string(),
  status: z.enum(['scheduled', 'cancelled']),
  createdAt: z.string(),
  updatedAt: z.string(),
  patient: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    middleName: z.string().nullable(),
    lastName: z.string().nullable(),
    email: z.string(),
    dateOfBirth: z.string().nullable(),
    address: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    ssn: z.string().nullable(),
  }),
});

export const patientSummarySchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string(),
  createdAt: z.string(),
  assignedTo: z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    type: z.string(),
  }).nullable(),
});

export const staffProfileResponseSchema = z.object({
  firstName: z.string(),
  middleName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  address: z.string(),
});

export const profileResponseSchema = z.object({
  firstName: z.string(),
  middleName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  address: z.string(),
  phoneNumber: z.string(),
  ssn: z.string(),
});
