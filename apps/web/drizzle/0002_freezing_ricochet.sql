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
