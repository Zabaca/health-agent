-- Session tracking for "Active devices" UI + revocation.
--
-- Web continues to use NextAuth's JWT session strategy; this table is keyed
-- by the JWT's `jti` claim. Mobile inserts directly with `sessionToken = jti`.
-- A row is created at sign-in and consulted by route guards on each request;
-- setting `revokedAt` invalidates the session for any future API call.

CREATE TABLE `Session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	`platform` text DEFAULT 'web' NOT NULL,
	`deviceName` text,
	`userAgent` text,
	`ip` text,
	`createdAt` text NOT NULL,
	`lastSeenAt` text,
	`revokedAt` text,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
