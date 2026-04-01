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
CREATE UNIQUE INDEX `StaffInvite_token_unique` ON `StaffInvite` (`token`);
