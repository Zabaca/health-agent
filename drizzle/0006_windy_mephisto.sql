CREATE TABLE `ReleaseRequestLog` (
	`id` text PRIMARY KEY NOT NULL,
	`releaseId` text NOT NULL,
	`type` text NOT NULL,
	`service` text DEFAULT 'faxage' NOT NULL,
	`status` text NOT NULL,
	`faxNumber` text,
	`recipientName` text,
	`apiResponse` text,
	`error` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON UPDATE no action ON DELETE cascade
);
