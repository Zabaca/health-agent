-- Make User.email nullable and add User.emailVerified.
--
-- Apple/Google may not return an email (Apple omits it on returning auth; either
-- provider can withhold it). Such users are created without an email and must
-- supply one during onboarding. SQLite cannot drop a NOT NULL constraint in
-- place, so the table is rebuilt. The rebuild also drops any orphan columns that
-- drifted onto local dev databases (image/name/legacy emailVerified) — the
-- column list below is the canonical schema.
--
-- email stays UNIQUE (two accounts can never share an email). emailVerified
-- records whether the stored email was asserted verified by a trusted source;
-- existing rows all had a required, in-use email under the old regime, so they
-- are backfilled to verified.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_User` (
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
	`disabled` integer DEFAULT false NOT NULL
);--> statement-breakpoint
INSERT INTO `__new_User`(
	`id`, `email`, `password`, `appleId`, `googleId`, `type`, `mustChangePassword`,
	`createdAt`, `firstName`, `middleName`, `lastName`, `dateOfBirth`, `address`,
	`phoneNumber`, `ssn`, `profileComplete`, `onboarded`, `avatarUrl`, `disabled`
) SELECT
	`id`, `email`, `password`, `appleId`, `googleId`, `type`, `mustChangePassword`,
	`createdAt`, `firstName`, `middleName`, `lastName`, `dateOfBirth`, `address`,
	`phoneNumber`, `ssn`, `profileComplete`, `onboarded`, `avatarUrl`, `disabled`
FROM `User`;--> statement-breakpoint
DROP TABLE `User`;--> statement-breakpoint
ALTER TABLE `__new_User` RENAME TO `User`;--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_appleId_unique` ON `User` (`appleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_googleId_unique` ON `User` (`googleId`);--> statement-breakpoint
UPDATE `User` SET `emailVerified` = true WHERE `email` IS NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=ON;
