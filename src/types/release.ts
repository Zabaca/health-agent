export interface ProviderFormData {
  id?: string;
  providerName: string;
  providerType: "Insurance" | "Facility";
  patientMemberId?: string;
  groupId?: string;
  planName?: string;
  phone?: string;
  fax?: string;
  providerEmail?: string;
  address?: string;
  membershipIdFront?: string;
  membershipIdBack?: string;
  historyPhysical: boolean;
  diagnosticResults: boolean;
  treatmentProcedure: boolean;
  prescriptionMedication: boolean;
  imagingRadiology: boolean;
  dischargeSummaries: boolean;
  specificRecords: boolean;
  specificRecordsDesc?: string;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  allAvailableDates: boolean;
  purpose?: string;
  purposeOther?: string;
}

export interface ReleaseFormData {
  // Patient Info
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  mailingAddress: string;
  phoneNumber: string;
  email: string;
  ssn: string;
  // Providers
  providers: ProviderFormData[];
  // Authorization
  authExpirationDate: string;
  authExpirationEvent?: string;
  authPrintedName: string;
  authSignatureImage?: string;
  authDate: string;
  authAgentName?: string;
}

export interface ReleaseSummary {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}
