ALTER TABLE `User` ADD `healthKitConnected` integer NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `IncomingFile` ADD `type` text;--> statement-breakpoint
ALTER TABLE `IncomingFile` ADD `time` text;--> statement-breakpoint
ALTER TABLE `IncomingFile` ADD `dataBlob` text;--> statement-breakpoint
ALTER TABLE `IncomingFile` ADD `externalId` text;--> statement-breakpoint
ALTER TABLE `IncomingFile` ADD `updatedAt` text;--> statement-breakpoint
CREATE INDEX `incomingFile_patient_source_type_time` ON `IncomingFile` (`patientId`,`source`,`type`,`time`);--> statement-breakpoint
CREATE UNIQUE INDEX `incomingFile_patient_source_externalId` ON `IncomingFile` (`patientId`,`source`,`externalId`);
