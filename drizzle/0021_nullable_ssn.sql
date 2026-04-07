-- Make releases.ssn nullable since SSN is now optional (last 4 digits only)
-- SQLite does not support DROP NOT NULL directly; we recreate via the standard workaround.
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_Release` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL REFERENCES User(id),
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
	`authPrintedName` text,
	`authSignatureImage` text,
	`authDate` text,
	`voided` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	`releaseCode` text
);
--> statement-breakpoint
INSERT INTO `__new_Release` SELECT * FROM `Release`;
--> statement-breakpoint
DROP TABLE `Release`;
--> statement-breakpoint
ALTER TABLE `__new_Release` RENAME TO `Release`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
