DROP INDEX "IncomingFaxLog_recvid_unique";--> statement-breakpoint
DROP INDEX "incomingFile_patient_source_type_time";--> statement-breakpoint
DROP INDEX "incomingFile_patient_source_externalId";--> statement-breakpoint
DROP INDEX "PasswordResetToken_token_unique";--> statement-breakpoint
DROP INDEX "PatientAssignment_patientId_unique";--> statement-breakpoint
DROP INDEX "Release_releaseCode_unique";--> statement-breakpoint
DROP INDEX "StaffInvite_token_unique";--> statement-breakpoint
DROP INDEX "User_email_unique";--> statement-breakpoint
DROP INDEX "User_appleId_unique";--> statement-breakpoint
DROP INDEX "User_googleId_unique";--> statement-breakpoint
DROP INDEX "ZabacaAgentRole_userId_unique";--> statement-breakpoint
ALTER TABLE `LinkIntent` ALTER COLUMN "expiresAt" TO "expiresAt" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `IncomingFaxLog_recvid_unique` ON `IncomingFaxLog` (`recvid`);--> statement-breakpoint
CREATE INDEX `incomingFile_patient_source_type_time` ON `IncomingFile` (`patientId`,`source`,`type`,`time`);--> statement-breakpoint
CREATE UNIQUE INDEX `incomingFile_patient_source_externalId` ON `IncomingFile` (`patientId`,`source`,`externalId`);--> statement-breakpoint
CREATE UNIQUE INDEX `PasswordResetToken_token_unique` ON `PasswordResetToken` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `PatientAssignment_patientId_unique` ON `PatientAssignment` (`patientId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Release_releaseCode_unique` ON `Release` (`releaseCode`);--> statement-breakpoint
CREATE UNIQUE INDEX `StaffInvite_token_unique` ON `StaffInvite` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_appleId_unique` ON `User` (`appleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_googleId_unique` ON `User` (`googleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `ZabacaAgentRole_userId_unique` ON `ZabacaAgentRole` (`userId`);--> statement-breakpoint
ALTER TABLE `Session` ALTER COLUMN "expires" TO "expires" text NOT NULL;