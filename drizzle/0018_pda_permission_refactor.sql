-- Refactor PatientDesignatedAgent permission columns in-place.
-- Renames: documentPermission→healthRecordsPermission, documentScope→healthRecordsScope
-- Replaces: canManageProviders(bool)→manageProvidersPermission('editor'|null)
-- Adds:     releasePermission (null for all existing rows)

ALTER TABLE `PatientDesignatedAgent` RENAME COLUMN `documentPermission` TO `healthRecordsPermission`;--> statement-breakpoint
ALTER TABLE `PatientDesignatedAgent` RENAME COLUMN `documentScope` TO `healthRecordsScope`;--> statement-breakpoint
ALTER TABLE `PatientDesignatedAgent` ADD COLUMN `manageProvidersPermission` text;--> statement-breakpoint
UPDATE `PatientDesignatedAgent` SET `manageProvidersPermission` = CASE WHEN `canManageProviders` = 1 THEN 'editor' ELSE NULL END;--> statement-breakpoint
ALTER TABLE `PatientDesignatedAgent` DROP COLUMN `canManageProviders`;--> statement-breakpoint
ALTER TABLE `PatientDesignatedAgent` ADD COLUMN `releasePermission` text;
