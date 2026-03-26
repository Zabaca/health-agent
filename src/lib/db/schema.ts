import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  /**
   * 'patient_designated_agent' — a user invited by a patient to act on their behalf.
   * This is NOT an organizational agent (admin/agent type). PDAs are patient-initiated
   * and patient-controlled. A PDA may eventually transition to 'patient' type.
   */
  type: text('type', { enum: ['patient', 'agent', 'admin', 'patient_designated_agent'] }).notNull().default('patient'),
  mustChangePassword: integer('mustChangePassword', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  firstName: text('firstName'),
  middleName: text('middleName'),
  lastName: text('lastName'),
  dateOfBirth: text('dateOfBirth'),
  address: text('address'),
  phoneNumber: text('phoneNumber'),
  ssn: text('ssn'),
  profileComplete: integer('profileComplete', { mode: 'boolean' }).notNull().default(false),
  onboarded: integer('onboarded', { mode: 'boolean' }).notNull().default(false),
  avatarUrl: text('avatarUrl'),
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

  // Release Authorization
  releaseAuthAgent: integer('releaseAuthAgent', { mode: 'boolean' }).notNull().default(false),
  releaseAuthZabaca: integer('releaseAuthZabaca', { mode: 'boolean' }).notNull().default(false),
  authAgentFirstName: text('authAgentFirstName'),
  authAgentLastName: text('authAgentLastName'),
  authAgentOrganization: text('authAgentOrganization'),
  authAgentAddress: text('authAgentAddress'),
  authAgentPhone: text('authAgentPhone'),
  authAgentEmail: text('authAgentEmail'),

  // Authorization
  authExpirationDate: text('authExpirationDate'),
  authExpirationEvent: text('authExpirationEvent'),
  authPrintedName: text('authPrintedName').notNull(),
  authSignatureImage: text('authSignatureImage'),
  authDate: text('authDate').notNull(),
  authAgentName: text('authAgentName'),
  voided: integer('voided', { mode: 'boolean' }).notNull().default(false),
  releaseCode: text('releaseCode').unique(),
});

export const providers = sqliteTable('Provider', {
  id: text('id').primaryKey(),
  releaseId: text('releaseId').notNull().references(() => releases.id, { onDelete: 'cascade' }),
  order: integer('order').notNull().default(0),

  // Provider Info
  providerName: text('providerName').notNull(),
  providerType: text('providerType').notNull(),
  physicianName: text('physicianName'),
  patientId: text('patientId'),
  insurance: text('insurance'),
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

  // Insurance-specific record fields
  benefitsCoverage: integer('benefitsCoverage', { mode: 'boolean' }).notNull().default(false),
  claimsPayment: integer('claimsPayment', { mode: 'boolean' }).notNull().default(false),
  eligibilityEnrollment: integer('eligibilityEnrollment', { mode: 'boolean' }).notNull().default(false),
  financialBilling: integer('financialBilling', { mode: 'boolean' }).notNull().default(false),

  // Hospital/Clinic-specific record fields
  medicalRecords: integer('medicalRecords', { mode: 'boolean' }).notNull().default(false),
  dentalRecords: integer('dentalRecords', { mode: 'boolean' }).notNull().default(false),
  otherNonSpecific: integer('otherNonSpecific', { mode: 'boolean' }).notNull().default(false),
  otherNonSpecificDesc: text('otherNonSpecificDesc'),

  // Sensitive information fields (Insurance, Hospital, Clinic)
  sensitiveCommDiseases: integer('sensitiveCommDiseases', { mode: 'boolean' }).notNull().default(false),
  sensitiveReproductiveHealth: integer('sensitiveReproductiveHealth', { mode: 'boolean' }).notNull().default(false),
  sensitiveHivAids: integer('sensitiveHivAids', { mode: 'boolean' }).notNull().default(false),
  sensitiveMentalHealth: integer('sensitiveMentalHealth', { mode: 'boolean' }).notNull().default(false),
  sensitiveSubstanceUse: integer('sensitiveSubstanceUse', { mode: 'boolean' }).notNull().default(false),
  sensitivePsychotherapy: integer('sensitivePsychotherapy', { mode: 'boolean' }).notNull().default(false),
  sensitiveOther: integer('sensitiveOther', { mode: 'boolean' }).notNull().default(false),
  sensitiveOtherDesc: text('sensitiveOtherDesc'),

  dateRangeFrom: text('dateRangeFrom'),
  dateRangeTo: text('dateRangeTo'),
  allAvailableDates: integer('allAvailableDates', { mode: 'boolean' }).notNull().default(false),
  purpose: text('purpose'),
  purposeOther: text('purposeOther'),
});

export const userProviders = sqliteTable('UserProvider', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  order: integer('order').notNull().default(0),

  // Provider Info
  providerName: text('providerName').notNull(),
  providerType: text('providerType').notNull(),
  physicianName: text('physicianName'),
  patientId: text('patientId'),
  insurance: text('insurance'),
  patientMemberId: text('patientMemberId'),
  groupId: text('groupId'),
  planName: text('planName'),
  phone: text('phone'),
  fax: text('fax'),
  providerEmail: text('providerEmail'),
  address: text('address'),
  membershipIdFront: text('membershipIdFront'),
  membershipIdBack: text('membershipIdBack'),
});

export const usersRelations = relations(users, ({ many }) => ({
  releases: many(releases),
  userProviders: many(userProviders),
  patientAssignment: many(patientAssignments, { relationName: 'patientAssignment' }),
  staffAssignments: many(patientAssignments, { relationName: 'staffAssignment' }),
  scheduledCallsAsPatient: many(scheduledCalls, { relationName: 'scheduledCallPatient' }),
  scheduledCallsAsAgent: many(scheduledCalls, { relationName: 'scheduledCallAgent' }),
  incomingFiles: many(incomingFiles),
  designatedAgentsAsPatient: many(patientDesignatedAgents, { relationName: 'pdaPatient' }),
  designatedAgentsAsAgent: many(patientDesignatedAgents, { relationName: 'pdaAgent' }),
}));

export const releasesRelations = relations(releases, ({ one, many }) => ({
  user: one(users, { fields: [releases.userId], references: [users.id] }),
  providers: many(providers),
  requestLog: many(releaseRequestLog),
}));

export const providersRelations = relations(providers, ({ one }) => ({
  release: one(releases, { fields: [providers.releaseId], references: [releases.id] }),
}));

export const userProvidersRelations = relations(userProviders, ({ one }) => ({
  user: one(users, { fields: [userProviders.userId], references: [users.id] }),
}));

export const patientAssignments = sqliteTable('PatientAssignment', {
  id: text('id').primaryKey(),
  patientId: text('patientId').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  assignedToId: text('assignedToId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const patientAssignmentsRelations = relations(patientAssignments, ({ one }) => ({
  patient: one(users, { fields: [patientAssignments.patientId], references: [users.id], relationName: 'patientAssignment' }),
  assignedTo: one(users, { fields: [patientAssignments.assignedToId], references: [users.id], relationName: 'staffAssignment' }),
}));

export const scheduledCalls = sqliteTable('ScheduledCall', {
  id: text('id').primaryKey(),
  patientId: text('patientId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agentId: text('agentId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scheduledAt: text('scheduledAt').notNull(),
  status: text('status', { enum: ['scheduled', 'cancelled'] }).notNull().default('scheduled'),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const scheduledCallsRelations = relations(scheduledCalls, ({ one }) => ({
  patient: one(users, { fields: [scheduledCalls.patientId], references: [users.id], relationName: 'scheduledCallPatient' }),
  agent: one(users, { fields: [scheduledCalls.agentId], references: [users.id], relationName: 'scheduledCallAgent' }),
}));

export const releaseRequestLog = sqliteTable('ReleaseRequestLog', {
  id:           text('id').primaryKey(),
  releaseId:    text('releaseId').notNull().references(() => releases.id, { onDelete: 'cascade' }),
  type:         text('type', { enum: ['fax'] }).notNull(),
  service:      text('service').notNull().default('faxage'),
  status:       text('status', { enum: ['success', 'failed', 'awaiting_confirmation'] }).notNull(),
  faxNumber:    text('faxNumber'),
  recipientName: text('recipientName'),
  apiResponse:  text('apiResponse'),
  httpResponse: text('httpResponse'),
  error:        integer('error', { mode: 'boolean' }).notNull().default(false),
  createdAt:    text('createdAt').notNull(),
});

export const releaseRequestLogRelations = relations(releaseRequestLog, ({ one }) => ({
  release: one(releases, { fields: [releaseRequestLog.releaseId], references: [releases.id] }),
}));

export const incomingFaxLog = sqliteTable('IncomingFaxLog', {
  id:        text('id').primaryKey(),
  recvid:    text('recvid').notNull().unique(),
  recvdate:  text('recvdate').notNull(),
  starttime: text('starttime').notNull(),
  cid:       text('cid'),
  dnis:      text('dnis'),
  pagecount: integer('pagecount'),
  tsid:      text('tsid'),
  status:    text('status', { enum: ['pending', 'retrieved', 'failed'] }).notNull().default('pending'),
  filename:  text('filename'),
  rawBody:   text('rawBody'),
  createdAt: text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const incomingFiles = sqliteTable('IncomingFile', {
  id:               text('id').primaryKey(),
  fileURL:          text('fileURL').notNull(),
  fileType:         text('fileType').notNull(),
  source:           text('source').notNull().default('fax'),
  incomingFaxLogId: text('incomingFaxLogId').references(() => incomingFaxLog.id),
  patientId:        text('patientId').references(() => users.id),
  createdAt:        text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const incomingFaxLogRelations = relations(incomingFaxLog, ({ many }) => ({
  files: many(incomingFiles),
}));

export const faxConfirm = sqliteTable('FaxConfirm', {
  id:           text('id').primaryKey(),
  jobid:        text('jobid'),
  commid:       text('commid'),
  destname:     text('destname'),
  destnum:      text('destnum'),
  shortstatus:  text('shortstatus'),
  longstatus:   text('longstatus'),
  sendtime:     text('sendtime'),
  completetime: text('completetime'),
  rawBody:      text('rawBody'),
  createdAt:    text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const fileUploadLog = sqliteTable('FileUploadLog', {
  id:             text('id').primaryKey(),
  incomingFileId: text('incomingFileId').notNull().references(() => incomingFiles.id, { onDelete: 'cascade' }),
  uploadedById:   text('uploadedById').notNull().references(() => users.id),
  originalName:   text('originalName').notNull(),
  uploadedAt:     text('uploadedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

export const incomingFilesRelations = relations(incomingFiles, ({ one }) => ({
  faxLog:    one(incomingFaxLog, { fields: [incomingFiles.incomingFaxLogId], references: [incomingFaxLog.id] }),
  patient:   one(users, { fields: [incomingFiles.patientId], references: [users.id] }),
  uploadLog: one(fileUploadLog, { fields: [incomingFiles.id], references: [fileUploadLog.incomingFileId] }),
}));

export const fileUploadLogRelations = relations(fileUploadLog, ({ one }) => ({
  incomingFile: one(incomingFiles, { fields: [fileUploadLog.incomingFileId], references: [incomingFiles.id] }),
  uploadedBy:   one(users, { fields: [fileUploadLog.uploadedById], references: [users.id] }),
}));

/**
 * patientDesignatedAgents — relationship table for Patient Designated Agents (PDAs).
 *
 * A PDA is a user INVITED BY A PATIENT to act on their behalf (e.g. a family member
 * or caregiver). This is NOT an organizational agent (admin/agent type users).
 * Access is fully patient-controlled and can be revoked at any time.
 *
 * Permissions are per-relationship:
 *   - documentPermission: null=no access, 'viewer'=read-only, 'editor'=read/write/delete/upload
 *   - documentScope: null=no access, 'all'=all docs including future, 'specific'=see grants table
 *   - canUpload: upload files on behalf of patient (implied by editor, but set explicitly)
 *   - canManageProviders: view/edit the patient's provider list
 *
 * Note: a PDA may eventually transition to a 'patient' type user. The relationship
 * record will remain valid regardless of the agent user's type.
 */
export const patientDesignatedAgents = sqliteTable('PatientDesignatedAgent', {
  id:                 text('id').primaryKey(),
  patientId:          text('patientId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agentUserId:        text('agentUserId').references(() => users.id, { onDelete: 'set null' }),
  inviteeEmail:       text('inviteeEmail').notNull(),
  relationship:       text('relationship'), // e.g. "Spouse", "Son", "Daughter", free text
  token:              text('token'),        // invite token, cleared after acceptance
  tokenExpiresAt:     text('tokenExpiresAt'),
  status:             text('status', { enum: ['pending', 'accepted', 'revoked'] }).notNull().default('pending'),
  documentPermission: text('documentPermission', { enum: ['viewer', 'editor'] }),
  documentScope:      text('documentScope', { enum: ['all', 'specific'] }),
  canUpload:          integer('canUpload', { mode: 'boolean' }).notNull().default(false),
  canManageProviders: integer('canManageProviders', { mode: 'boolean' }).notNull().default(false),
  createdAt:          text('createdAt').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt:          text('updatedAt').notNull().$defaultFn(() => new Date().toISOString()),
});

/**
 * patientDesignatedAgentDocumentGrants — per-document access grants for PDAs.
 * Only used when patientDesignatedAgents.documentScope = 'specific'.
 * Each row grants a PDA access to one specific document.
 */
export const patientDesignatedAgentDocumentGrants = sqliteTable('PatientDesignatedAgentDocumentGrant', {
  id:                              text('id').primaryKey(),
  patientDesignatedAgentRelationId: text('patientDesignatedAgentRelationId').notNull().references(() => patientDesignatedAgents.id, { onDelete: 'cascade' }),
  incomingFileId:                  text('incomingFileId').notNull().references(() => incomingFiles.id, { onDelete: 'cascade' }),
});

export const patientDesignatedAgentsRelations = relations(patientDesignatedAgents, ({ one, many }) => ({
  patient:   one(users, { fields: [patientDesignatedAgents.patientId], references: [users.id], relationName: 'pdaPatient' }),
  agentUser: one(users, { fields: [patientDesignatedAgents.agentUserId], references: [users.id], relationName: 'pdaAgent' }),
  documentGrants: many(patientDesignatedAgentDocumentGrants),
}));

export const patientDesignatedAgentDocumentGrantsRelations = relations(patientDesignatedAgentDocumentGrants, ({ one }) => ({
  relation:     one(patientDesignatedAgents, { fields: [patientDesignatedAgentDocumentGrants.patientDesignatedAgentRelationId], references: [patientDesignatedAgents.id] }),
  incomingFile: one(incomingFiles, { fields: [patientDesignatedAgentDocumentGrants.incomingFileId], references: [incomingFiles.id] }),
}));
