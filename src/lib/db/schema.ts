import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const releases = sqliteTable('Release', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),

  // Patient Info
  firstName: text('firstName').notNull(),
  middleName: text('middleName'),
  lastName: text('lastName').notNull(),
  dateOfBirth: text('dateOfBirth').notNull(),
  mailingAddress: text('mailingAddress').notNull(),
  phoneNumber: text('phoneNumber').notNull(),
  email: text('email').notNull(),
  ssn: text('ssn').notNull(),

  // Authorization
  authExpirationDate: text('authExpirationDate'),
  authExpirationEvent: text('authExpirationEvent'),
  authPrintedName: text('authPrintedName').notNull(),
  authSignatureImage: text('authSignatureImage'),
  authDate: text('authDate').notNull(),
  authAgentName: text('authAgentName'),
});

export const providers = sqliteTable('Provider', {
  id: text('id').primaryKey(),
  releaseId: text('releaseId').notNull().references(() => releases.id, { onDelete: 'cascade' }),
  order: integer('order').notNull().default(0),

  // Provider Info
  providerName: text('providerName').notNull(),
  providerType: text('providerType').notNull(),
  patientMemberId: text('patientMemberId'),
  groupId: text('groupId'),
  planName: text('planName'),
  phone: text('phone'),
  fax: text('fax'),
  providerEmail: text('providerEmail'),
  address: text('address'),
  membershipIdFront: text('membershipIdFront'),
  membershipIdBack: text('membershipIdBack'),

  // Record Request
  historyPhysical: integer('historyPhysical', { mode: 'boolean' }).notNull().default(false),
  diagnosticResults: integer('diagnosticResults', { mode: 'boolean' }).notNull().default(false),
  treatmentProcedure: integer('treatmentProcedure', { mode: 'boolean' }).notNull().default(false),
  prescriptionMedication: integer('prescriptionMedication', { mode: 'boolean' }).notNull().default(false),
  imagingRadiology: integer('imagingRadiology', { mode: 'boolean' }).notNull().default(false),
  dischargeSummaries: integer('dischargeSummaries', { mode: 'boolean' }).notNull().default(false),
  specificRecords: integer('specificRecords', { mode: 'boolean' }).notNull().default(false),
  specificRecordsDesc: text('specificRecordsDesc'),
  dateRangeFrom: text('dateRangeFrom'),
  dateRangeTo: text('dateRangeTo'),
  allAvailableDates: integer('allAvailableDates', { mode: 'boolean' }).notNull().default(false),
  purpose: text('purpose'),
  purposeOther: text('purposeOther'),
});

export const usersRelations = relations(users, ({ many }) => ({
  releases: many(releases),
}));

export const releasesRelations = relations(releases, ({ one, many }) => ({
  user: one(users, { fields: [releases.userId], references: [users.id] }),
  providers: many(providers),
}));

export const providersRelations = relations(providers, ({ one }) => ({
  release: one(releases, { fields: [providers.releaseId], references: [releases.id] }),
}));
