import type { InferSelectModel } from 'drizzle-orm';
import type { releases, providers, users, userProviders } from './schema';

export type UserRow = InferSelectModel<typeof users>;
export type ReleaseRow = InferSelectModel<typeof releases>;
export type ProviderRow = InferSelectModel<typeof providers>;
export type UserProviderRow = InferSelectModel<typeof userProviders>;

export type ReleaseSummary = Pick<ReleaseRow, 'id' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt' | 'voided'> & { providerNames: string[] };
export type ReleaseWithProviders = ReleaseRow & { providers: ProviderRow[] };
