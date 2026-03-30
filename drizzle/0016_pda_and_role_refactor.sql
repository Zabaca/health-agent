-- Introduce PatientDesignatedAgent, PatientDesignatedAgentDocumentGrant,
-- and ZabacaAgentRole. Collapse all non-admin user types into 'user'.

CREATE TABLE `PatientDesignatedAgent` (
  `id` text PRIMARY KEY NOT NULL,
  `patientId` text NOT NULL REFERENCES `User`(`id`) ON DELETE CASCADE,
  `agentUserId` text REFERENCES `User`(`id`) ON DELETE SET NULL,
  `inviteeEmail` text NOT NULL,
  `relationship` text,
  `token` text,
  `tokenExpiresAt` text,
  `status` text NOT NULL DEFAULT 'pending',
  `healthRecordsPermission` text,
  `healthRecordsScope` text,
  `canUpload` integer NOT NULL DEFAULT false,
  `manageProvidersPermission` text,
  `releasePermission` text,
  `createdAt` text NOT NULL,
  `updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `PatientDesignatedAgentDocumentGrant` (
  `id` text PRIMARY KEY NOT NULL,
  `patientDesignatedAgentRelationId` text NOT NULL REFERENCES `PatientDesignatedAgent`(`id`) ON DELETE CASCADE,
  `incomingFileId` text NOT NULL REFERENCES `IncomingFile`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `ZabacaAgentRole` (
  `id` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL UNIQUE REFERENCES `User`(`id`) ON DELETE CASCADE,
  `createdAt` text NOT NULL
);
--> statement-breakpoint
INSERT INTO ZabacaAgentRole (id, userId, createdAt)
SELECT lower(hex(randomblob(16))), id, createdAt
FROM User WHERE type = 'agent';
--> statement-breakpoint
UPDATE User SET type = 'user' WHERE type != 'admin';
