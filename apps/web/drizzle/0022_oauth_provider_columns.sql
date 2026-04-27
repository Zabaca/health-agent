-- JAM-276: OAuth provider linkage on the users table.
--   * Make `password` nullable so OAuth-only users (Apple / Google) don't need one.
--   * Add `appleId` and `googleId` (Apple / Google `sub` claims), each unique nullable.
-- SQLite cannot alter NOT NULL on an existing column, so we recreate the table.
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
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
	`disabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_User` (
	`id`, `email`, `password`, `type`, `mustChangePassword`, `createdAt`,
	`firstName`, `middleName`, `lastName`, `dateOfBirth`,
	`address`, `phoneNumber`, `ssn`,
	`profileComplete`, `onboarded`, `avatarUrl`, `disabled`
) SELECT
	`id`, `email`, `password`, `type`, `mustChangePassword`, `createdAt`,
	`firstName`, `middleName`, `lastName`, `dateOfBirth`,
	`address`, `phoneNumber`, `ssn`,
	`profileComplete`, `onboarded`, `avatarUrl`, `disabled`
FROM `User`;
--> statement-breakpoint
DROP TABLE `User`;
--> statement-breakpoint
ALTER TABLE `__new_User` RENAME TO `User`;
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_appleId_unique` ON `User` (`appleId`);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_googleId_unique` ON `User` (`googleId`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
