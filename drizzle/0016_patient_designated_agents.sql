-- Add 'patient_designated_agent' to users.type enum (SQLite doesn't enforce enums, no ALTER needed)

-- PatientDesignatedAgent: relationship table for patient-invited designated agents.
-- See schema.ts for full documentation of this table's purpose and constraints.
CREATE TABLE `PatientDesignatedAgent` (
  `id` text PRIMARY KEY NOT NULL,
  `patientId` text NOT NULL REFERENCES `User`(`id`) ON DELETE CASCADE,
  `agentUserId` text REFERENCES `User`(`id`) ON DELETE SET NULL,
  `inviteeEmail` text NOT NULL,
  `relationship` text,
  `token` text,
  `tokenExpiresAt` text,
  `status` text NOT NULL DEFAULT 'pending',
  `documentPermission` text,
  `documentScope` text,
  `canUpload` integer NOT NULL DEFAULT false,
  `canManageProviders` integer NOT NULL DEFAULT false,
  `createdAt` text NOT NULL,
  `updatedAt` text NOT NULL
);

-- PatientDesignatedAgentDocumentGrant: per-document access for PDAs with documentScope='specific'.
CREATE TABLE `PatientDesignatedAgentDocumentGrant` (
  `id` text PRIMARY KEY NOT NULL,
  `patientDesignatedAgentRelationId` text NOT NULL REFERENCES `PatientDesignatedAgent`(`id`) ON DELETE CASCADE,
  `incomingFileId` text NOT NULL REFERENCES `IncomingFile`(`id`) ON DELETE CASCADE
);
