CREATE TABLE `IncomingFaxLog` (
	`id` text PRIMARY KEY NOT NULL,
	`recvid` text NOT NULL,
	`recvdate` text NOT NULL,
	`starttime` text NOT NULL,
	`cid` text,
	`dnis` text,
	`pagecount` integer,
	`tsid` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `IncomingFaxLog_recvid_unique` ON `IncomingFaxLog` (`recvid`);--> statement-breakpoint
CREATE TABLE `IncomingFile` (
	`id` text PRIMARY KEY NOT NULL,
	`filePath` text NOT NULL,
	`fileType` text NOT NULL,
	`source` text DEFAULT 'fax' NOT NULL,
	`incomingFaxLogId` text,
	`patientId` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`incomingFaxLogId`) REFERENCES `IncomingFaxLog`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patientId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
