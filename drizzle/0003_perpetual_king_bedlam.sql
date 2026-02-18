ALTER TABLE `Release` ADD `releaseAuthAgent` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Release` ADD `releaseAuthZabaca` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `Release` ADD `authAgentFirstName` text;--> statement-breakpoint
ALTER TABLE `Release` ADD `authAgentLastName` text;--> statement-breakpoint
ALTER TABLE `Release` ADD `authAgentOrganization` text;--> statement-breakpoint
ALTER TABLE `Release` ADD `authAgentAddress` text;--> statement-breakpoint
ALTER TABLE `Release` ADD `authAgentPhone` text;--> statement-breakpoint
ALTER TABLE `Release` ADD `authAgentEmail` text;