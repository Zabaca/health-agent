CREATE TABLE `PasswordResetToken` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL REFERENCES `User`(`id`) ON DELETE CASCADE,
	`token` text NOT NULL UNIQUE,
	`expiresAt` text NOT NULL,
	`usedAt` text
);
