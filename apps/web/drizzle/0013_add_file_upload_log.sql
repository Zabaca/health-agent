CREATE TABLE `FileUploadLog` (
	`id` text PRIMARY KEY NOT NULL,
	`incomingFileId` text NOT NULL REFERENCES `IncomingFile`(`id`) ON DELETE CASCADE,
	`uploadedById` text NOT NULL REFERENCES `User`(`id`),
	`originalName` text NOT NULL,
	`uploadedAt` text NOT NULL
);
