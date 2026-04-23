import type { InferSelectModel } from 'drizzle-orm';
import type { releases, providers, users, userProviders, patientAssignments, scheduledCalls, releaseRequestLog } from './schema';

export type UserRow = InferSelectModel<typeof users>;
export type ReleaseRow = InferSelectModel<typeof releases>;
export type ProviderRow = InferSelectModel<typeof providers>;
export type UserProviderRow = InferSelectModel<typeof userProviders>;
export type PatientAssignmentRow = InferSelectModel<typeof patientAssignments>;
export type ScheduledCallRow = InferSelectModel<typeof scheduledCalls>;
export type ReleaseRequestLogRow = InferSelectModel<typeof releaseRequestLog>;

export type ReleaseSummary = Pick<ReleaseRow, 'id' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt' | 'voided' | 'authSignatureImage' | 'releaseCode' | 'releaseAuthAgent' | 'authAgentFirstName' | 'authAgentLastName'> & { providerNames: string[] };
export type ReleaseWithProviders = ReleaseRow & { providers: ProviderRow[] };
