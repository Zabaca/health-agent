-- Recreate PatientDesignatedAgent with new granular permission columns.
-- Maps old: documentPermission→healthRecordsPermission, documentScope→healthRecordsScope,
--           canManageProviders(bool)→manageProvidersPermission('editor'|null)
-- New:      releasePermission (null for all existing rows)

PRAGMA foreign_keys = OFF;--> statement-breakpoint
CREATE TABLE `PatientDesignatedAgent_new` (
  `id` text PRIMARY KEY NOT NULL,
  `patientId` text NOT NULL,
  `agentUserId` text,
  `inviteeEmail` text NOT NULL,
  `relationship` text,
  `token` text,
  `tokenExpiresAt` text,
  `status` text NOT NULL DEFAULT 'pending',
  `healthRecordsPermission` text,
  `healthRecordsScope` text,
  `manageProvidersPermission` text,
  `releasePermission` text,
  `createdAt` text NOT NULL,
  `updatedAt` text NOT NULL,
  FOREIGN KEY (`patientId`) REFERENCES `User`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`agentUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL
);

INSERT INTO `PatientDesignatedAgent_new`
  SELECT
    id, patientId, agentUserId, inviteeEmail, relationship, token, tokenExpiresAt, status,
    documentPermission        AS healthRecordsPermission,
    documentScope             AS healthRecordsScope,
    CASE WHEN canManageProviders = 1 THEN 'editor' ELSE NULL END AS manageProvidersPermission,
    NULL                      AS releasePermission,
    createdAt, updatedAt
  FROM `PatientDesignatedAgent`;

DROP TABLE `PatientDesignatedAgent`;--> statement-breakpoint
ALTER TABLE `PatientDesignatedAgent_new` RENAME TO `PatientDesignatedAgent`;--> statement-breakpoint
PRAGMA foreign_keys = ON;
