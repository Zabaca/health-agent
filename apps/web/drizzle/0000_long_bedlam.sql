CREATE TABLE `FaxConfirm` (
	`id` text PRIMARY KEY NOT NULL,
	`jobid` text,
	`commid` text,
	`destname` text,
	`destnum` text,
	`shortstatus` text,
	`longstatus` text,
	`sendtime` text,
	`completetime` text,
	`rawBody` text,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `FileUploadLog` (
	`id` text PRIMARY KEY NOT NULL,
	`incomingFileId` text NOT NULL,
	`uploadedById` text NOT NULL,
	`originalName` text NOT NULL,
	`uploadedAt` text NOT NULL,
	FOREIGN KEY (`incomingFileId`) REFERENCES `IncomingFile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `IncomingFaxLog` (
	`id` text PRIMARY KEY NOT NULL,
	`recvid` text NOT NULL,
	`recvdate` text NOT NULL,
	`starttime` text NOT NULL,
	`cid` text,
	`dnis` text,
	`pagecount` integer,
	`tsid` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`filename` text,
	`rawBody` text,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `IncomingFaxLog_recvid_unique` ON `IncomingFaxLog` (`recvid`);--> statement-breakpoint
CREATE TABLE `IncomingFile` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text DEFAULT 'fax' NOT NULL,
	`fileURL` text NOT NULL,
	`fileType` text NOT NULL,
	`incomingFaxLogId` text,
	`patientId` text,
	`releaseCode` text,
	`userProviderId` text,
	`type` text,
	`time` text,
	`dataBlob` text,
	`externalId` text,
	`createdAt` text NOT NULL,
	`updatedAt` text,
	`deletedAt` text,
	`deletedById` text,
	FOREIGN KEY (`incomingFaxLogId`) REFERENCES `IncomingFaxLog`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patientId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userProviderId`) REFERENCES `UserProvider`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deletedById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `incomingFile_patient_source_type_time` ON `IncomingFile` (`patientId`,`source`,`type`,`time`);--> statement-breakpoint
CREATE UNIQUE INDEX `incomingFile_patient_source_externalId` ON `IncomingFile` (`patientId`,`source`,`externalId`);--> statement-breakpoint
CREATE TABLE `LinkIntent` (
	`nonce` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`expiresAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `PasswordResetToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` text NOT NULL,
	`usedAt` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PasswordResetToken_token_unique` ON `PasswordResetToken` (`token`);--> statement-breakpoint
CREATE TABLE `PatientAssignment` (
	`id` text PRIMARY KEY NOT NULL,
	`patientId` text NOT NULL,
	`assignedToId` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`patientId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PatientAssignment_patientId_unique` ON `PatientAssignment` (`patientId`);--> statement-breakpoint
CREATE TABLE `PatientDesignatedAgent` (
	`id` text PRIMARY KEY NOT NULL,
	`patientId` text NOT NULL,
	`agentUserId` text,
	`inviteeEmail` text NOT NULL,
	`relationship` text,
	`token` text,
	`tokenExpiresAt` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`healthRecordsPermission` text,
	`manageProvidersPermission` text,
	`releasePermission` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`patientId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agentUserId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `Provider` (
	`id` text PRIMARY KEY NOT NULL,
	`releaseId` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`providerName` text NOT NULL,
	`providerType` text NOT NULL,
	`physicianName` text,
	`patientId` text,
	`insurance` text,
	`patientMemberId` text,
	`groupId` text,
	`planName` text,
	`phone` text,
	`fax` text,
	`providerEmail` text,
	`address` text,
	`membershipIdFront` text,
	`membershipIdBack` text,
	`historyPhysical` integer DEFAULT false NOT NULL,
	`diagnosticResults` integer DEFAULT false NOT NULL,
	`treatmentProcedure` integer DEFAULT false NOT NULL,
	`prescriptionMedication` integer DEFAULT false NOT NULL,
	`imagingRadiology` integer DEFAULT false NOT NULL,
	`dischargeSummaries` integer DEFAULT false NOT NULL,
	`specificRecords` integer DEFAULT false NOT NULL,
	`specificRecordsDesc` text,
	`benefitsCoverage` integer DEFAULT false NOT NULL,
	`claimsPayment` integer DEFAULT false NOT NULL,
	`eligibilityEnrollment` integer DEFAULT false NOT NULL,
	`financialBilling` integer DEFAULT false NOT NULL,
	`medicalRecords` integer DEFAULT false NOT NULL,
	`dentalRecords` integer DEFAULT false NOT NULL,
	`otherNonSpecific` integer DEFAULT false NOT NULL,
	`otherNonSpecificDesc` text,
	`sensitiveCommDiseases` integer DEFAULT false NOT NULL,
	`sensitiveReproductiveHealth` integer DEFAULT false NOT NULL,
	`sensitiveHivAids` integer DEFAULT false NOT NULL,
	`sensitiveMentalHealth` integer DEFAULT false NOT NULL,
	`sensitiveSubstanceUse` integer DEFAULT false NOT NULL,
	`sensitivePsychotherapy` integer DEFAULT false NOT NULL,
	`sensitiveOther` integer DEFAULT false NOT NULL,
	`sensitiveOtherDesc` text,
	`dateRangeFrom` text,
	`dateRangeTo` text,
	`allAvailableDates` integer DEFAULT false NOT NULL,
	`purpose` text,
	`purposeOther` text,
	FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ReleaseRequestLog` (
	`id` text PRIMARY KEY NOT NULL,
	`releaseId` text NOT NULL,
	`type` text NOT NULL,
	`service` text DEFAULT 'faxage' NOT NULL,
	`status` text NOT NULL,
	`faxNumber` text,
	`recipientName` text,
	`apiResponse` text,
	`httpResponse` text,
	`error` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Release` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`firstName` text NOT NULL,
	`middleName` text,
	`lastName` text NOT NULL,
	`dateOfBirth` text NOT NULL,
	`mailingAddress` text NOT NULL,
	`phoneNumber` text NOT NULL,
	`email` text NOT NULL,
	`ssn` text,
	`releaseAuthAgent` integer DEFAULT false NOT NULL,
	`releaseAuthZabaca` integer DEFAULT false NOT NULL,
	`authAgentFirstName` text,
	`authAgentLastName` text,
	`authAgentOrganization` text,
	`authAgentAddress` text,
	`authAgentPhone` text,
	`authAgentEmail` text,
	`authExpirationDate` text,
	`authExpirationEvent` text,
	`authPrintedName` text NOT NULL,
	`authSignatureImage` text,
	`authDate` text NOT NULL,
	`authAgentName` text,
	`voided` integer DEFAULT false NOT NULL,
	`releaseCode` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Release_releaseCode_unique` ON `Release` (`releaseCode`);--> statement-breakpoint
CREATE TABLE `ScheduledCall` (
	`id` text PRIMARY KEY NOT NULL,
	`patientId` text NOT NULL,
	`agentId` text NOT NULL,
	`scheduledAt` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`patientId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agentId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `Session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` text NOT NULL,
	`platform` text DEFAULT 'web' NOT NULL,
	`deviceName` text,
	`userAgent` text,
	`ip` text,
	`country` text,
	`region` text,
	`city` text,
	`latitude` text,
	`longitude` text,
	`createdAt` text NOT NULL,
	`lastSeenAt` text,
	`revokedAt` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `StaffInvite` (
	`id` text PRIMARY KEY NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`token` text NOT NULL,
	`tokenExpiresAt` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`invitedById` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `StaffInvite_token_unique` ON `StaffInvite` (`token`);--> statement-breakpoint
CREATE TABLE `UserProvider` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`providerName` text NOT NULL,
	`providerType` text NOT NULL,
	`physicianName` text,
	`patientId` text,
	`insurance` text,
	`patientMemberId` text,
	`groupId` text,
	`planName` text,
	`phone` text,
	`fax` text,
	`providerEmail` text,
	`address` text,
	`membershipIdFront` text,
	`membershipIdBack` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`emailVerified` integer DEFAULT false NOT NULL,
	`password` text,
	`appleId` text,
	`googleId` text,
	`type` text DEFAULT 'user' NOT NULL,
	`mustChangePassword` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	`firstName` text,
	`middleName` text,
	`lastName` text,
	`dateOfBirth` text,
	`address` text,
	`phoneNumber` text,
	`ssn` text,
	`profileComplete` integer DEFAULT false NOT NULL,
	`onboarded` integer DEFAULT false NOT NULL,
	`avatarUrl` text,
	`disabled` integer DEFAULT false NOT NULL,
	`deactivatedAt` text,
	`purgeAfter` text,
	`deletedEmail` text,
	`appleRefreshToken` text,
	`healthKitConnected` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_appleId_unique` ON `User` (`appleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_googleId_unique` ON `User` (`googleId`);--> statement-breakpoint
CREATE TABLE `ZabacaAgentRole` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ZabacaAgentRole_userId_unique` ON `ZabacaAgentRole` (`userId`);