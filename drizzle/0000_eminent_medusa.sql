CREATE TABLE `Provider` (
	`id` text PRIMARY KEY NOT NULL,
	`releaseId` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`providerName` text NOT NULL,
	`providerType` text NOT NULL,
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
	`dateRangeFrom` text,
	`dateRangeTo` text,
	`allAvailableDates` integer DEFAULT false NOT NULL,
	`purpose` text,
	`purposeOther` text,
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
	`ssn` text NOT NULL,
	`authExpirationDate` text,
	`authExpirationEvent` text,
	`authPrintedName` text NOT NULL,
	`authSignatureImage` text,
	`authDate` text NOT NULL,
	`authAgentName` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);