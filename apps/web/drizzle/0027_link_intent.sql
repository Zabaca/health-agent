-- One-shot intents for linking an OAuth provider to an already-signed-in user.
CREATE TABLE `LinkIntent` (
	`nonce` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`expiresAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE cascade
);
