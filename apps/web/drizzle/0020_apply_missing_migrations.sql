-- Apply migrations that existed as SQL files but were never registered in the journal.
-- These SQL files were added in PRs #16 and #17 but their journal entries were lost in merge conflicts:
--   0015_add_release_code_to_incoming_file
--   0017_soft_delete_incoming_file
--   0018_remove_pda_document_grants

ALTER TABLE `IncomingFile` ADD COLUMN `releaseCode` text;
--> statement-breakpoint
ALTER TABLE `IncomingFile` ADD COLUMN `deletedAt` text;
--> statement-breakpoint
ALTER TABLE `IncomingFile` ADD COLUMN `deletedById` text REFERENCES User(id);
--> statement-breakpoint
DROP TABLE IF EXISTS `PatientDesignatedAgentDocumentGrant`;
--> statement-breakpoint
ALTER TABLE `PatientDesignatedAgent` DROP COLUMN `healthRecordsScope`;
--> statement-breakpoint
ALTER TABLE `PatientDesignatedAgent` DROP COLUMN `canUpload`;
