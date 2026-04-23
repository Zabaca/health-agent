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
ALTER TABLE `User` ADD `mustChangePassword` integer DEFAULT false NOT NULL;