import type { InferSelectModel } from 'drizzle-orm';
import type { releases, providers, users } from './schema';

export type UserRow = InferSelectModel<typeof users>;
export type ReleaseRow = InferSelectModel<typeof releases>;
export type ProviderRow = InferSelectModel<typeof providers>;

export type ReleaseSummary = Pick<ReleaseRow, 'id' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt'>;
export type ReleaseWithProviders = ReleaseRow & { providers: ProviderRow[] };
