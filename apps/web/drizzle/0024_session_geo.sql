-- Geo columns for the Session table. Populated at sign-in from Vercel's
-- x-vercel-ip-* edge headers (free on all plans). All nullable — local dev
-- (loopback IPs) and non-Vercel deploys produce nulls.

ALTER TABLE `Session` ADD COLUMN `country` text;--> statement-breakpoint
ALTER TABLE `Session` ADD COLUMN `region` text;--> statement-breakpoint
ALTER TABLE `Session` ADD COLUMN `city` text;--> statement-breakpoint
ALTER TABLE `Session` ADD COLUMN `latitude` text;--> statement-breakpoint
ALTER TABLE `Session` ADD COLUMN `longitude` text;
