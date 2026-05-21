-- Account deletion (soft-delete) state on User.
-- deactivatedAt = single source of truth for "deleted" (distinct from disabled).
-- purgeAfter = when the retention window expires and the cron hard-deletes.
-- deletedEmail = original email preserved for audit (NON-unique) after the
--   unique `email` column is nulled to free re-registration.
-- appleRefreshToken = encrypted; used to call Apple /auth/revoke on deletion.
ALTER TABLE `User` ADD COLUMN `deactivatedAt` text;--> statement-breakpoint
ALTER TABLE `User` ADD COLUMN `purgeAfter` text;--> statement-breakpoint
ALTER TABLE `User` ADD COLUMN `deletedEmail` text;--> statement-breakpoint
ALTER TABLE `User` ADD COLUMN `appleRefreshToken` text;
