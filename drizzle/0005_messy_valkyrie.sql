ALTER TABLE `Release` ADD `releaseCode` text;--> statement-breakpoint
CREATE UNIQUE INDEX `Release_releaseCode_unique` ON `Release` (`releaseCode`);